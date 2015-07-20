var app = {
	gisController: gis,
	kuzzleController: {},
	userController: {},

	/*
		initUI: function() {
			window.addEventListener('load', function() {
				///kick and dirty ui logic !
				var user_cabble = document.querySelector("#user_cabble");
				var cab_cabble = document.querySelector("#cab_cabble");

				user_cabble.addEventListener("click", function(event) {
					user_cabble.innerHTML = "Cabble is looking for your ride";
					app.kuzzleController.setUserType("customer");
					cab_cabble.innerHTML = "I'm looking for a customer";
				});

				cab_cabble.addEventListener("click", function() {
					cab_cabble.innerHTML = "Cabble is looking for a customer for you";
					app.kuzzleController.setUserType("taxi");
					user_cabble.innerHTML = "I need a ride";
				});

			});
		},

		*/
	init: function() {

		//simulate taxi and customer not in the same position, and moving
		app.simulate = true;

		//this.initUI();

		//everybody know app
		this.gisController.app = app;
		this.userController.app = app;
		this.kuzzleController.app = app;

		console.log("##############Cabble initialisation START !#######################");

		this.gisController.init() //create the map with nothing on it
			.then(app.userController.init) //get user info from local storage
			.then(app.gisController.resetAllMarks) //get the GPS user location add the user marker with position and type  (show "?" icon" if no type)
			.then(app.kuzzleController.init) //kuzzle listen to our app
			.then(
				function() {
					if (app.simulate)
						setInterval(app.gisController.moveSlowly, 10000);
					console.log("##############Cabble initialisation ENDED !#######################");
					//default type user (must be remove and change by modal dialog)
					//this.kuzzleController.setUserType("customer");
				}
			).
		catch(function(e) {
			console.error("ERRRRRRRROR during Cabble initialisation ");
			console.error(e);
		});

	}
};

////////////////////////user module/////////////////
(function UserModule(app) {

	//////////////////privates attributes///////////////////////
	var user = {
		userId: null,
		whoami: {
			type: '',
			available: true
		},
	};

	var app = app;

	//////////////////privates methods///////////////////////
	/**
	 * Create myself in Kuzzle or update my position in it.
	 *
	 */
	function sendMyPosition() {
		var userPosition = app.gisController.getUserPosition();
		if (!userPosition) {
			console.log("no position for user");
			return;
		}

		app.kuzzleController.setUserPosition({
			userId: user.whoami._id,
			type: user.whoami.type,
			position: {
				lat: userPosition.lat(),
				lon: userPosition.lng()
			}
		});
	};

	//////////////////public methods (i.e exposed) ///////////////////////

	app.userController = {
		init: function() {
			console.log("user controller creation...");
			return new Promise(
				function(resolve, reject) {
					app.userController.getUserLocally().then(function(value) {
						if (value)
							user = value;
						console.log("...user controller ended");
						setInterval(sendMyPosition.bind(app.kuzzleController), 3000);
						resolve();

					});
				});
		},
		getUser: function() {
			return user;
		},
		getUserLocally: function() {
			return new Promise(
				function(resolve, reject) {
					var resolver = Promise.pending();
					localforage.getItem('cable_user')
						.then(function(value) {
							resolve(JSON.parse(value));
						});
				});

		},
		setUserLocally: function() {
			var resolver = Promise.pending();
			localforage.setItem('cable_user', JSON.stringify(user))
				.then(function() {
					resolver.resolve();
				});
			return resolver.promise;
		}

	}

})(app);

////////////////////////kuzzle module/////////////////
(function KuzzleModule(app) {

	//////////////////(wanabee) static  privates attributes///////////////////////

	var
		KUZZLE_URL = 'api.uat.kuzzle.io:7512',
		//KUZZLE_URL = 'http://localhost:8081',
		CABBLE_COLLECTION_POSITIONS = 'coding-challenge-cabble-positions',
		CABBLE_COLLECTION_USERS = 'coding-challenge-cabble-users',
		CABBLE_COLLECTION_RIDES = 'coding-challenge-cabble-rides';

	//////////////////privates attributes///////////////////////
	var
		kuzzle = new Kuzzle(KUZZLE_URL),
		refreshFilterTimer,
		positionsRoom,
		ridesRoom,
		currentRide;

	//////////////////public methodes (i.e exposed) ///////////////////////

	app.kuzzleController = {
		init: function() {

			console.log("kuzzle controller creation...");
			return new Promise(
				function(resolve, reject) {
					// TODO: retrieve userId from localstorage
					var user = app.userController.getUser();

					if (!user.userId) {
						kuzzle.create(CABBLE_COLLECTION_USERS, user.whoami, true, function(response) {
							if (response.error) {
								console.error(response.error);
								reject();
							} else {
								app.userController.getUser().userId = response.result._id;
								app.userController.getUser().whoami._id = response.result._id;
								app.userController.setUserLocally().then(
									function() {
										app.kuzzleController.listenToRidesProposals();
										console.log("...kuzzle controller ended");
										resolve();
									}
								);

								console.log("cannot save user  locally");
							}
						});
					}

					app.kuzzleController.listenToRidesProposals();
					console.log("...kuzzle controller ended");
					resolve();
				});
		},

		setUserPosition: function(positions) {
			kuzzle.create(CABBLE_COLLECTION_POSITIONS, positions, false);
		},

		/**
		 * - Gets the top-left and bottom-right corners coordinates from google maps
		 * - Creates a kuzzle filter including geolocalization bounding box
		 * - Unsubscribe from previous room if we were listening to one
		 * - Subscribe to kuzzle with the new filter
		 */
		refreshKuzzleFilter: function() {
			var
				bound = app.gisController.getMapBounds(),
				user = app.userController.getUser(),
				filterUserType = user.whoami.type === 'taxi' ? 'customer' : 'taxi',
				filter = {
					and: [{
						term: {
							type: filterUserType
						}
					}, {
						geoBoundingBox: {
							position: {
								top_left: {
									lat: bound.neCorner.lat(),
									lon: bound.swCorner.lng()
								},
								bottom_right: {
									lat: bound.swCorner.lat(),
									lon: bound.neCorner.lng()
								}
							}
						}
					}]
				};

			// If a currentRide has been accepted, we only want to subscribe to the other person position
			if (currentRide) {
				//	console.log("ride");
				//	console.log(currentRide);
			}
			if (currentRide && currentRide.status && currentRide.status.indexOf('accepted') !== -1) {
				filter.and.push({
					term: {
						_id: user.whoami.type === 'taxi' ? currentRide.customer : currentRide.taxi
					}
				});
			}

			if (positionsRoom) {
				kuzzle.unsubscribe(positionsRoom);
			}

			positionsRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter, function(message) {
				if (message.error) {
					console.error(message.error);
				}
				//console.log("we got position  ");
				//console.log(message);
				if (message.action == "create") {
					var data = message.data;
					if (!data)
						data = message;
					var userPosition = data.body.position;
					var userType = data.body.type;
					var userId = data.body.userId;
					app.gisController.addPosition(userPosition, userType, userId);
				} else {
					console.log("we got a strange message ");
					console.log(message);

				}

			});
			//console.log("we subscribe to ");
			//console.log(positionsRoom);
		},

		setUserType: function(userType) {

			//console.log("set user type " + userType);
			var refreshInterval;

			app.userController.getUser().whoami.type = userType;
			//return;
			app.userController.setUserLocally().then(function() {
				kuzzle.update(CABBLE_COLLECTION_USERS, app.userController.getUser().whoami);

				if (userType === 'customer') {
					refreshInterval = 60000;
				} else if (userType === 'taxi') {
					refreshInterval = 10000;
				}

				//app.gisController.resetAllMarks();

				if (refreshFilterTimer) {
					clearInterval(refreshFilterTimer);
				}
				app.kuzzleController.refreshKuzzleFilter();

				refreshFilterTimer = setInterval(function() {
					//console.log("refresh inter " + userType);
					app.kuzzleController.refreshKuzzleFilter()
				}.bind(this), refreshInterval);
			});
		},

		listenToRidesProposals: function() {
			var
				filter = {
					and: []
				},
				rideFilter = {
					term: {}
				},
				// we don't want to listen to our own actions
				statusFilter = {
					not: {
						terms: {
							status: [
								'proposed_by_' + app.userController.getUser().whoami.type,
								'refused_by_' + app.userController.getUser().whoami.type,
								'accepted_by_' + app.userController.getUser().whoami.type
							]
						}
					}
				};

			rideFilter.term[app.userController.getUser().whoami.type] = app.userController.getUser().whoami._id;
			filter.and = [rideFilter, statusFilter];

			if (ridesRoom) {
				kuzzle.unsubscribe(ridesRoom);
			}

			console.log("filter for ride prop");
			console.log(filter);

			ridesRoom = kuzzle.subscribe(CABBLE_COLLECTION_RIDES, filter, function(message) {
				//console.log("recive prop");
				//console.log(message);
				if (message.error) {
					console.error(message.error);
					return false;
				}

				console.log("recie a ride ");
				console.log(message);

				app.kuzzleController.manageRideProposal(message);
			});
		},

		manageRideProposal: function(rideProposal) {

			var rideInfo = rideProposal.body;
			//._source;
			//if(!rideInfo)
			//	rideInfo = rideProposal.body;

			console.log(rideInfo);
			if (!rideInfo) {
				console.log("no ride info");
				return;
			}

			if (!rideInfo.status) {
				console.log("no status info");
				return;
			}

			if (rideInfo && rideInfo.status.indexOf('proposed_by') !== -1) {
				if (!app.userController.getUser().whoami.available === undefined && !app.userController.getUser().whoami.available) {
					this.declineRideProposal(rideProposal._id);
					return;
				} else {
					var proposedByTaxy = (rideInfo.status === "proposed_by_taxi");
					var target = proposedByTaxy ? rideInfo.customer : rideInfo.taxi;
					var source = !proposedByTaxy ? rideInfo.customer : rideInfo.taxi;

					app.gisController.showPopupRideProposal(source, target).then(function(response) {
						if (response === "accept") {
							app.kuzzleController.acceptRideProposal(rideProposal);
							return;
						}
						if (response === "decline") {
							app.kuzzleController.declineRideProposal(rideProposal);
							return;
						}
					});
				}
			} else if (rideInfo.status.indexOf('refused_by') !== -1) {
				currentRide = null;
				// TODO: ride declined
			} else if (rideInfo.status.indexOf('accepted_by') !== -1) {
				currentRide = rideProposal;
				app.gisController.showCenterControl();
				// TODO: ride accepted
			}
		},

		/**
		 * sends a ride proposal to a client/taxi
		 *
		 * @param userId User Id of the *OTHER* person we wish to contact
		 */
		sendRideProposal: function(userId) {

			console.log("send ride porposal");
			var
				rideProposal = {},
				myUserType = app.userController.getUser().whoami.type;

			rideProposal['customer'] = myUserType === 'taxi' ? userId : app.userController.getUser().whoami._id;
			rideProposal['taxi'] = myUserType === 'customer' ? userId : app.userController.getUser().whoami._id;
			rideProposal['status'] = 'proposed_by_' + myUserType;

			/*
			 foolproof check: cleanly decline the previous proposal if somehow a user manages to
			  create another ride while still in the middle of a ride transaction
			*/
			if (currentRide) {
				this.declineRideProposal(currentRide._id);
			}

			kuzzle.create(CABBLE_COLLECTION_RIDES, rideProposal, true, function(response) {
				if (response.error) {
					console.error(response.error);
					return false;
				}
				//console.log("response from sending ");
				//console.log(response);
				currentRide = response.result;
			});
		},

		/**
		 * accepts a ride proposal
		 *
		 */
		acceptRideProposal: function(rideProposal) {
			var
				myUserType = app.userController.getUser().whoami.type,
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

			userSubFilter.term[myUserType] = app.userController.getUser().whoami._id;
			listProposal.filter.and.push(userSubFilter);

			app.userController.getUser().whoami.available = false;
			kuzzle.update(CABBLE_COLLECTION_RIDES, acceptedRide);
			currentRide = rideProposal;
			app.gisController.showCenterControl();

			/*
			At this point, we have 1 accepted ride proposal, and possibly multiple
			ride proposed in the meantime.
			So here we list these potential proposals and gracefully decline these
			 */
			console.log('=== LISTPROPOSAL FILTER:', listProposal);
			kuzzle.search(CABBLE_COLLECTION_RIDES, listProposal, function(searchResult) {
				if (searchResult.error) {
					console.log(new Error(searchResult.error));
					return false;
				}
				console.log("searresult ");
				console.log(searchResult);

				searchResult.result.hits.hits.forEach(function(element) {
					// element is not a ride document, but it contains the _id element we need to decline the ride
					app.kuzzleController.declineRideProposal(element);
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
				status: 'refused_by_' + app.userController.getUser().whoami.type
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

			app.userController.getUser().whoami.available = true;
			currentRide = null;

			kuzzle.update(CABBLE_COLLECTION_RIDES, finishedRide);
		}
	}

})(app);

app.init();
