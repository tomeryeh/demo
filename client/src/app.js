var app = {
	gisController: gis,
	kuzzleController: {},
	userController: {},

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
	init: function() {

		this.initUI();

		this.gisController.app = app;
		this.userController.app = app;
		this.kuzzleController.app = app;

		this.gisController.init()
			.then(app.userController.init) //user from local storage init
			.then(app.kuzzleController.init) //kuzzle init
			.then(
				function() {
					//default type user (must be remove and change by modal dialog)
					//this.kuzzleController.setUserType("customer");
				}.bind(app)
			).
		catch(function(e) {
			console.error("ERRRRRRRROR " + e);
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

		},
		available: true
	};

	var app = app;

	//////////////////privates methods///////////////////////
	/**
	 * Create myself in Kuzzle or update my position in it.
	 *
	 */
	function sendMyPosition() {
		var userPosition = app.gisController.getUserPosition();
		app.kuzzleController.setUserPosition({
			userId: user.whoami._id,
			type: user.whoami.type,
			position: {
				lat: userPosition.lat(),
				lon: userPosition.lng()
			}
		});
	}

	//////////////////public methods (i.e exposed) ///////////////////////

	app.userController = {
		init: function() {
			console.log("create user ");
			return new Promise(
				function(resolve, reject) {
					app.userController.getUserLocally().then(function(value) {
						if (value)
							user = JSON.parse(value);

						console.log(" user created ");
						resolve();
						//setInterval(sendMyPosition.bind(this), 3000);
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
							console.log("user found loca");
							console.log(value);
							resolve(value);
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
		CABBLE_COLLECTION_POSITIONS = 'coding-challenge-cabble-positions',
		CABBLE_COLLECTION_USERS = 'coding-challenge-cabble-users',
		CABBLE_COLLECTION_RIDES = 'coding-challenge-cabble-rides';

	//////////////////privates attributes///////////////////////
	var
		kuzzle = new Kuzzle(KUZZLE_URL),
		refreshFilterTimer,
		positionsRoom,
		ridesRoom,
		ride;

	//////////////////public methodes (i.e exposed) ///////////////////////

	app.kuzzleController = {
		init: function() {

			console.log("create Kuzzle");
			return new Promise(
				function(resolve, reject) {
					// TODO: retrieve userId from localstorage
					var user = app.userController.getUser();

					if (!user.userId) {
						kuzzle.create(CABBLE_COLLECTION_USERS, user.whoami, true, function(response) {

							console.log("response ");
							console.log(response);
							if (response.error) {
								console.error(response.error);
								reject();
							} else {
								app.userController.getUser().userId = response.result._id;
								app.userController.getUser().whoami._id = response.result._id;
								app.userController.setUserLocally().then(resolve);
								console.log("Kuzzle created ");
							}
						});
					}
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

			// If a ride has been accepted, we only want to subscribe to the other person position
			if (ride && ride.status.indexOf('accepted') !== -1) {
				filter.and.push({
					term: {
						_id: user.whoami.type === 'taxi' ? ride.customer : ride.taxi
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
				// TODO: display or update the received user
			});
			console.log("we subscribe to ");
			console.log(positionsRoom);
		},

		setUserType: function(userType) {
			var refreshInterval;

			app.userController.getUser().whoami.type = userType;
			app.userController.setUserLocally();
			kuzzle.update(CABBLE_COLLECTION_USERS, app.userController.getUser().whoami);

			if (userType === 'customer') {
				refreshInterval = 6000;
			} else if (userType === 'taxi') {
				refreshInterval = 1000;
			}

			app.gisController.resetAllMarks();

			if (refreshFilterTimer) {
				clearInterval(refreshFilterTimer);
			}

			refreshFilterTimer = setInterval(function() {
				console.log("refresh inter " + userType);
				this.refreshKuzzleFilter()
			}.bind(this), refreshInterval);
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

			ridesRoom = kuzzle.subscribe(CABBLE_COLLECTION_RIDES, filter, function(message) {
				if (message.error) {
					console.error(message.error);
					return false;
				}

				this.manageRideProposal(message.result);
			});
		},

		manageRideProposal: function(rideProposal) {
			if (rideProposal.status.indexOf('proposed_by') !== -1) {
				/*
				 Automatically decline a ride if I'm not available
				 Should only happen if a ride is proposed to me before I had the chance to notify kuzzle
				 about my availability change
				 */
				if (!app.userController.getUser().whoami.available) {
					this.declineRideProposal(rideProposal._id);
				} else {
					// TODO: got a ride proposal => implement accept/cancel UI actions
					// Use acceptRideProposal or declineRideProposal when needed
				}
			} else if (rideProposal.status.indexOf('refused_by') !== -1) {
				// TODO: ride declined
			} else if (rideProposal.status.indexOf('accepted_by') !== -1) {
				// TODO: ride accepted
			}
		},

		/**
		 * sends a ride proposal to a client/taxi
		 *
		 * @param userId User Id of the *OTHER* person we wish to contact
		 */
		sendRideProposal: function(userId) {
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
			if (ride) {
				this.declineRideProposal(ride._id);
			}

			kuzzle.create(CABBLE_COLLECTION_RIDES, rideProposal, true, function(response) {
				if (response.error) {
					console.error(response.error);
					return false;
				}

				ride = response.result;
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
				listProposal = {
					and: [{
						term: {
							status: 'proposed_by_' + (myUserType === 'taxi' ? 'customer' : 'taxi')
						}
					}, {
						not: {
							term: {
								_id: rideProposal._id
							}
						}
					}]
				};

			listProposal.and[0].term[myUserType] = app.userController.getUser().whoami._id;

			app.userController.getUser().whoami.available = false;
			kuzzle.update(CABBLE_COLLECTION_RIDES, acceptedRide);
			ride = rideProposal;

			/*
			At this point, we have 1 accepted ride proposal, and possibly multiple
			ride proposed in the meantime.
			So here we list these potential proposals and gracefully decline these
			 */
			kuzzle.search(CABBLE_COLLECTION_RIDES, listProposal, function(searchResult) {
				if (searchResult.error) {
					console.log(new Error(error));
					return false;
				}

				searchResult.result.hits.hits.forEach(function(element) {
					// element is not a ride document, but it contains the _id element we need to decline the ride
					this.declineRideProposal(element);
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
			var finishedRide = {
				_id: ride._id,
				status: 'completed'
			};

			app.userController.getUser().whoami.available = true;
			ride = null;

			kuzzle.update(CABBLE_COLLECTION_RIDES, finishedRide);
		}
	}

})(app);

app.init();
