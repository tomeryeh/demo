/**
 *	Kuzzle controller
 *	all the Kuzzle pub sub methods.
 *
 **/
window.kuzzleController = (function() {
	var
		kuzzle = Kuzzle.init(config.kuzzleUrl),

		//the three collections we are interesting to
		CABBLE_COLLECTION_POSITIONS = 'cabble-positions',
		CABBLE_COLLECTION_USERS = 'cabble-users',
		CABBLE_COLLECTION_RIDES = 'cabble-rides',

		refreshFilterTimerSubPosition,

		//used to keep the user type change (suppose an user change from taxi to customer, 
		//	it became no more relevant to show it.)
		assocRoomToUser = {},

		//the room we are susbscribe to currently
		positionsSubscribeRoom,
		userSubscribedRoom,

		//the current ride if 
		currentRide = null;

	return {
		init: function() {
			return new Promise(
				function(resolve, reject) {
					var user = userController.getUser();
					//this is the first time we use Cabble so we ask an id user to Kuzzle
					if (!user.userId) {
						kuzzleController.createUser(user, function() {
							kuzzleController.initPubSub();
							resolve();
						});
					} else {
						//user has been found in localstorage from userController
						kuzzleController.initPubSub();
						resolve();
					}
				});
		},
		initPubSub: function() {

			//positions collection
			kuzzleController.publishPositions();
			kuzzleController.subscribeToPositions();

			//users collection
			kuzzleController.subscribeToUsers();


			//rides collection
			kuzzleController.subscribeToRides();
		},

		///////////////////////////////////////// POSITIONS PUBSUB //////////////////////////////////////

		publishPositions: function() {
			//we send position for user every 3000 millisecond
			setInterval(
				function() {
					gisController.getGeoLoc().
					then(gisController.setUserPosition).
					then(function() {
						var userPosition = gisController.getUserPosition();
						var userId = userController.getUserId();
						var userType = userController.getUserType();

						if (!userPosition) {
							console.log("no position for user");
							return;
						}
						if (!userType)
							return;

						//we send a non perisistant document : our current position
						kuzzle.create(CABBLE_COLLECTION_POSITIONS, {
							userId: userId,
							type: userType,
							position: {
								lat: userPosition.lat,
								lon: userPosition.lng
							},
							roomName: userSubscribedRoom
						}, false);
					});
				}, 3000);
		},
		subscribeToPositions: function() {
			var userType = userController.getUserType();
			var refreshInterval = 5000;
			if (userType === 'customer') {
				refreshInterval = 3000;
			} else if (userType === 'taxi') {
				refreshInterval = 1000;
			}

			//we can change user type anytime and our filter rate must change accordingly ()
			//so we keep a ref to the previous timer to remove it.
			// and so we must for idempotence purpose
			if (refreshFilterTimerSubPosition)
				clearInterval(refreshFilterTimerSubPosition);

			refreshFilterTimerSubPosition = setInterval(function() {

				if (!userController.getUserType())
					return;

				var
					bound = gisController.getMapBounds(),
					user = userController.getUser(),
					filterUserType = userController.getCandidateType(),
					filter = {
						and: [{
							term: {
								type: filterUserType
							}
						}, {
							geoBoundingBox: {
								position: {
									top_left: {
										lat: bound.neCorner.lat,
										lon: bound.swCorner.lng
									},
									bottom_right: {
										lat: bound.swCorner.lat,
										lon: bound.neCorner.lng
									}
								}
							}
						}]
					};

				if (currentRide && currentRide.status && currentRide.status.indexOf('accepted') !== -1) {
					filter.and.push({
						term: {
							_id: userController.getUserType() === 'taxi' ? currentRide.customer : currentRide.taxi
						}
					});
				}

				if (positionsSubscribeRoom) {
					kuzzle.unsubscribe(positionsSubscribeRoom);
				}

				positionsSubscribeRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter, function(error, message) {
					if (error) {
						console.error(error);
						return;
					}

					if (message.action == "create") {
						assocRoomToUser[message._source.roomName] = message._source.userId;
						var candidatePosition = message._source.position;
						var candidateType = message._source.type;
						var candidateId = message._source.userId;

						if (candidateType === userController.getUserType())
							return;
						gisController.addMarker(candidatePosition, candidateType, candidateId);
					}
				});
			}, refreshInterval);

		},

		///////////////////////////////////////// USERS PUBSUB //////////////////////////////////////

		createUser: function(user, callBack) {
			kuzzle.create(CABBLE_COLLECTION_USERS, user.whoami, true, function(error, response) {
				if (error) {
					console.error(error);
				} else {
					user.userId = response._id;
					user.whoami._id = response._id;
					userController.setInLocalStorage().then(
						callBack
					);
				}
			});
		},

		publishUserType: function(userType) {
			if (!userType)
				return;

			userController.setUserType(userType).then(function() {
				gisController.setUserType(userType);
				kuzzle.update(CABBLE_COLLECTION_USERS, userController.getUser().whoami,
					function(error, response) {
						if (error) {
							console.log(error);
							return;
						}
						kuzzleController.subscribeToUsers();
						kuzzleController.subscribeToPositions();
					});
			});
		},

		subscribeToUsers: function() {
			if (!userController.getUserType())
				return;

			var userStatus = {
				exists: {
					field: 'type'
						//type: [userController.getUserType() === "taxi" ? "customer" : "taxi"]
				}
			};
			if (userSubscribedRoom)
				kuzzle.unsubscribe(userSubscribedRoom);


			userSubscribedRoom = kuzzle.subscribe(CABBLE_COLLECTION_USERS, userStatus, function(error, message) {
				if (error) {
					console.error(error);
					return false;
				}

				//we are instersting to unscribe i.e user change status interest
				if (!message || message.action != "off")
					return;

				//if this user was not on our map nothing to do
				var userWithSameStatus = assocRoomToUser[message.roomName];
				if (!userWithSameStatus)
					return;
				//else we remove it from the map
				gisController.removeCandidate(userWithSameStatus);
				//if we where aslo in a ride with this candidate, we must break it
				if (currentRide &&
					(currentRide._source.taxi === userWithSameStatus || currentRide._source.customer === userWithSameStatus)) {
					kuzzleController.finishRide();
				}
			});
		},

		///////////////////////////////////////// RIDES PUBSUB //////////////////////////////////////

		subscribeToRides: function() {
			var
				filter = {
					and: []
				},
				rideFilter = {
					term: {}
				},
				user = userController.getUser(),
				userType = userController.getUserType(),
				statusFilter = {
					not: {
						terms: {
							status: [
								'proposed_by_' + userType,
								'refused_by_' + userType,
								'accepted_by_' + userType
							]
						}
					}
				};

			if (!userType)
				return;

			rideFilter.term[userType] = userController.getUserId();
			filter.and = [rideFilter, statusFilter];

			kuzzle.subscribe(CABBLE_COLLECTION_RIDES, filter, function(error, message) {
				if (error) {
					console.error(error);
					return false;
				}
				kuzzleController.manageRideProposal(message);
			});
		},
		/**
		 * manageRideProposal internally when recive from subscription just above
		 *
		 * @param candidateId User Id of the candidate we wish to contact
		 */
		manageRideProposal: function(rideProposal) {
			var rideInfo = rideProposal._source;

			if (!rideInfo || !rideInfo.status) {
				return;
			}

			if (rideInfo.status.indexOf('proposed_by') !== -1) {
				if (!userController.isAvailable()) {
					this.declineRideProposal(rideProposal);
					return;
				} else {
					var candidateType = (rideInfo.status === "proposed_by_taxi") ? "taxi" : "customer";
					var userType = userController.getUserType();

					//TODO REMOVE user has change his state between the last time he listening to ride
					if (userType === candidateType)
						return;
					var target = (rideInfo.status === "proposed_by_taxi") ? rideInfo.customer : rideInfo.taxi;
					var source = (rideInfo.status === "proposed_by_taxi") ? rideInfo.taxi : rideInfo.customer;
					gisController.showPopupRideProposal(source, target, rideProposal);
				}
			} else if (rideInfo.status.indexOf('refused_by') !== -1) {
				gisController.onRideRefused(rideProposal);
				currentRide = null;
			} else if (rideInfo.status.indexOf('accepted_by') !== -1) {
				currentRide = rideProposal;
				gisController.onRideAccepted(rideProposal);
			} else if (rideInfo.status.indexOf('completed') !== -1) {
				currentRide = null;
				gisController.onRideEnded(rideInfo);
			}
		},

		/**
		 * sends a ride proposal to a client/taxi
		 *
		 * @param candidateId User Id of the candidate we wish to contact
		 */
		publishRideProposal: function(candidateId) {
			var
				rideProposal = {},
				myUserType = userController.getUserType();

			rideProposal.customer = myUserType === 'taxi' ? candidateId : userController.getUserId();
			rideProposal.taxi = myUserType === 'customer' ? candidateId : userController.getUserId();
			rideProposal.status = 'proposed_by_' + myUserType;
			rideProposal.position = gisController.getUserPosition();

			/*
			 foolproof check: cleanly decline the previous proposal if somehow a user manages to
			  create another ride while still in the middle of a ride transaction
			*/
			if (currentRide) {
				this.declineRideProposal(currentRide);
			}

			kuzzle.create(CABBLE_COLLECTION_RIDES, rideProposal, true, function(error, response) {
				if (error) {
					console.error(error);
					return false;
				}
				currentRide = response.result;
			});
		},

		/**
		 * accepts a ride proposal
		 *
		 */
		acceptRideProposal: function(rideProposal) {
			var
				myUserType = userController.getUserType(),
				acceptedRide = {
					_id: rideProposal._id,
					status: 'accepted_by_' + myUserType
				},
				// All rides, except this one, proposed by others and involving me
				listProposal = {
					filter: {
						and: [{
							term: {
								status: 'proposed_by_' + (myUserType === 'taxi' ? 'customer' : 'taxi')
							}
						}, {
							not: {
								ids: {
									values: [rideProposal._id]
								}
							}
						}]
					}
				},
				userSubFilter = {
					term: {}
				};

			userSubFilter.term[myUserType] = userController.getUserId();
			listProposal.filter.and.push(userSubFilter);

			userController.setAvailable(false);
			kuzzle.update(CABBLE_COLLECTION_RIDES, acceptedRide);
			currentRide = rideProposal;
			gisController.onRideAccepted(currentRide);

			/*
			At this point, we have 1 accepted ride proposal, and possibly multiple
			ride proposed in the meantime.
			So here we list these potential proposals and gracefully decline these
			 */
			kuzzle.search(CABBLE_COLLECTION_RIDES, listProposal, function(error, searchResult) {
				if (error) {
					console.log(error);
					return false;
				}

				searchResult.hits.hits.forEach(function(element) {
					// element is not a ride document, but it contains the _id element we need to decline the ride
					kuzzleController.declineRideProposal(element);
				});
			});
		},

		/**
		 * declines a ride proposal
		 *
		 */
		declineRideProposal: function(rideProposal) {
			var declinedRide = {
				_id: rideProposal._id,
				status: 'refused_by_' + userController.getUserType()
			};

			kuzzle.update(CABBLE_COLLECTION_RIDES, declinedRide);
		},

		/**
		 * ride conclusion
		 */
		finishRide: function() {
			if (!currentRide) {
				console.log("no curent ride");
				return;
			}

			var finishedRide = {
				_id: currentRide._id,
				status: 'completed'
			};

			userController.setAvailable(true);
			kuzzle.update(CABBLE_COLLECTION_RIDES, finishedRide);
		}
	};
})();
