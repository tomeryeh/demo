/**
 *	Kuzzle controller
 *	all the Kuzzle pub sub methods.
 *
 **/
window.kuzzleController = (function() {
	var
	//the Kuzzle url adress
		KUZZLE_URL = 'http://localhost:7512',
		kuzzle = Kuzzle.init(KUZZLE_URL),

		//the three collections we are interesting to
		CABBLE_COLLECTION_POSITIONS = 'cabble-positions',
		CABBLE_COLLECTION_USERS = 'cabble-users',
		CABBLE_COLLECTION_RIDES = 'cabble-rides',

		refreshFilterTimerSubPosition,
		refreshFilterTimerPubPosition,

		//used to keep the user type change (suppose an user change from taxi to csutomer, 
		//	it became no more relevant to show it.)
		assocRoomUserUserId = {},

		//the room we are susbscribe to currently
		positionsSubscribeRoom,
		ridesSusbcribeRoom,
		userSubscribeRoom,

		//the current ride if 
		currentRide = null;

	return {
		init: function() {
			return new Promise(
				function(resolve, reject) {

					var user = userController.getUser();

					//no data has been retrieve about user on localstorage,
					//we ask Cabble for an userId
					if (!user.userId) {
						kuzzle.create(CABBLE_COLLECTION_USERS, user.whoami, true, function(error, response) {
							if (error) {
								console.error(error);
								reject();
							} else {
								user.userId = response._id;
								user.whoami._id = response._id;
								userController.setInLocalStorage().then(
									function() {
										kuzzleController.initPubSub();
										resolve();
									}
								);
							}
						});
					}
					//user has been found in localstorage from userController
					//we set user (this method will init thhe pubsub )
					kuzzleController.setUserType(userController.getUserType());
					resolve();
				});
		},

		setUserType: function(userType) {
			if (!userType)
				return;

			userController.setUserType(userType)
				.then(function() {
					gisController.setUserType(userType);
					kuzzle.update(CABBLE_COLLECTION_USERS, userController.getUser().whoami);
					kuzzleController.initPubSub();
				});
		},

		initPubSub: function() {
			kuzzleController.subscribeToUsers();
			kuzzleController.subscribeToRides();

			var userType = userController.getUserType();
			var refreshInterval = 5000;
			if (userType === 'customer') {
				refreshInterval = 1000;
			} else if (userType === 'taxi') {
				refreshInterval = 1000;
			}

			if (refreshFilterTimerSubPosition)
				clearInterval(refreshFilterTimerSubPosition);

			kuzzleController.subscribeToPositions();

			refreshFilterTimerSubPosition = setInterval(function() {
				kuzzleController.subscribeToPositions()
			}, refreshInterval);

			if (refreshFilterTimerPubPosition)
				clearInterval(refreshFilterTimerPubPosition);

			//we send position for user every 3000 millisecond
			kuzzleController.publishPositions();
			refreshFilterTimerPubPosition = setInterval(function() {
				kuzzleController.publishPositions();
			}, 3000);
		},

		publishPositions: function() {
			var userPosition = gisController.getUserPosition();
			var userId = userController.getUserId();
			var userType = userController.getUserType();

			if (!userPosition) {
				console.log("no position for user");
				return;
			}
			if (!userType)
				return;

			kuzzle.create(CABBLE_COLLECTION_POSITIONS, {
				userId: userId,
				type: userType,
				position: {
					lat: userPosition.lat,
					lon: userPosition.lng
				},
				roomName: userSubscribeRoom
			}, false);
		},

		/**
		 * - Gets the top-left and bottom-right corners coordinates from gisController
		 * - Creates a kuzzle filter including geolocalization bounding box
		 * - Unsubscribe from previous room if we were listening to one
		 * - Subscribe to kuzzle positions with the new filter.
		 */
		subscribeToPositions: function() {
			var
				bound = gisController.getMapBounds(),
				user = userController.getUser();

			if (!user.whoami.type)
				return;

			var filterUserType = userController.getUserType() === 'taxi' ? 'customer' : 'taxi',
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

					assocRoomUserUserId[message._source.roomName] = message._source.userId;
					var candidatePosition = message._source.position;
					var candidateType = message._source.type;
					var candidateId = message._source.userId;

					//user has change his state between the last time he listening to ride
					if (candidateType === userController.getUserType())
						return;

					gisController.addMarker(candidatePosition, candidateType, candidateId);
				}
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

			if (userSubscribeRoom)
				kuzzle.unsubscribe(userSubscribeRoom);

			userSubscribeRoom = kuzzle.subscribe(CABBLE_COLLECTION_USERS, userStatus, function(error, message) {
				if (error) {
					console.error(error);
					return false;
				}

				//we are instersting to unscribe i.e user change status interest
				if (!message || message.action != "off")
					return;
				//if this user was not on our map nothing to do
				var userWithSameStatus = assocRoomUserUserId[message.roomName];
				if (!userWithSameStatus)
					return;
				//else we remove it from the map
				gisController.removeCandidate(userWithSameStatus);
				//if we where aslo in a ride with this candidate, we must break it
				if (currentRide &&
					(currentRide._source.taxi === userWithSameStatus ||  currentRide._source.customer === userWithSameStatus)) {
					kuzzleController.finishRide();
				}
			});
		},

		subscribeToRides: function() {
			var
				filter = {
					and: []
				},
				rideFilter = {
					term: {}
				};

			var user = userController.getUser();

			if (!user.whoami.type)
				return;

			statusFilter = {
				not: {
					terms: {
						status: [
							'proposed_by_' + user.whoami.type,
							'refused_by_' + user.whoami.type,
							'accepted_by_' + user.whoami.type
						]
					}
				}
			};

			rideFilter.term[user.whoami.type] = user.whoami._id;
			filter.and = [rideFilter, statusFilter];

			if (ridesSusbcribeRoom) {
				kuzzle.unsubscribe(ridesSusbcribeRoom);
			}

			ridesSusbcribeRoom = kuzzle.subscribe(CABBLE_COLLECTION_RIDES, filter, function(error, message) {
				if (error) {
					console.error(error);
					return false;
				}
				kuzzleController.manageRideProposal(message);
			});
		},

		manageRideProposal: function(rideProposal) {
			var rideInfo = rideProposal._source;

			if (!rideInfo) {
				console.log("no ride info");
				return;
			}

			if (!rideInfo.status) {
				console.log("no status info");
				return;
			}

			if (rideInfo && rideInfo.status.indexOf('proposed_by') !== -1) {
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

			rideProposal['customer'] = myUserType === 'taxi' ? candidateId : userController.getUserId();
			rideProposal['taxi'] = myUserType === 'customer' ? candidateId : userController.getUserId();
			rideProposal['status'] = 'proposed_by_' + myUserType;
			rideProposal['position'] = gisController.getUserPosition();

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
				myUserType = userController.getUser().whoami.type,
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

			userSubFilter.term[myUserType] = userController.getUser().whoami._id;
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
				status: 'refused_by_' + userController.getUser().whoami.type
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
		},

	};
})();
