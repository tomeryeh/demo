var app = {
	gisController: gis,
	kuzzleController: {},
	userController: {},
	init: function() {

		window.onload = function() {
			///kick and dirty ui logic !
			var user_cabble = document.querySelector("#user_cabble");
      var cab_cabble = document.querySelector("#cab_cabble");
			user_cabble.addEventListener("click", function(event) {
			 user_cabble.innerHTML = "Cabble is looking for your ride";
				app.kuzzleController.setUserType("customer");
        cab_cabble.innerHTML = "I'm looking for a customer";
			});

			cab_cabble.addEventListener("click", function(event) {
				cab_cabble.innerHTML = "Cabble is looking for a customer for you";
				app.kuzzleController.setUserType("taxi");
        user_cabble.innerHTML = "I need a ride";
			});
		}

		//gis is already define because script is load in order
		this.gisController.app = app;
		//first try to found user info in local storage
		this.userController.init();
		//init Kuzzle with possibiliy existing user
		this.kuzzleController.init();
	}
};

////////////////////////user module/////////////////
(function UserModule(app) {

	//////////////////privates attributes///////////////////////
	var user = {
		userId: false,
		whoami: {
			type: '',
			_id: false
		}
	};

	var app = app;

	//////////////////privates methodes///////////////////////
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
	};

	//////////////////public methodes (i.e exposed) ///////////////////////

	app.userController = {
		init: function() {
			this.getUserLocally(
				function(value) {
					if (value) {
						var user = JSON.parse(value);
						//console.dir("data from storage");
						//console.dir(user);
					}
					setInterval(sendMyPosition.bind(this), 3000);
				}
				.bind(this));
		},
		getUser: function() {
			return user;
		},
		getUserLocally: function(callBack) {
			localforage.getItem('cable_user', function(err, value) {
				callBack(value);
			})
		},
		setUserLocally: function() {
			//console.log("saving user ");
			//console.log(user);
			localforage.setItem('cable_user', JSON.stringify(user));
		}

	}

})(app);

////////////////////////kuzzle module/////////////////
(function KuzzleModule(app) {

	//////////////////(wanabee) static  privates attributes///////////////////////

	var KUZZLE_URL = 'api.uat.kuzzle.io:7512';
	var CABBLE_COLLECTION_POSITIONS = 'coding-challenge-cabble-positions';
	var CABBLE_COLLECTION_USERS = 'coding-challenge-cabble-users';

	//////////////////privates attributes///////////////////////
	var kuzzle = new Kuzzle(KUZZLE_URL);
	var refreshFilterTimer;
	var customersRoom;
	var positionsRoom;
	var taxisRoom;
	var app = app;

	//////////////////public methodes (i.e exposed) ///////////////////////

	app.kuzzleController = {
		init: function() {

			// TODO: retrieve userId from localstorage
			var user = app.userController.getUser();

			if (!user.userId) {
				user.userId = kuzzle.create(CABBLE_COLLECTION_USERS, user.whoami, true, function(response) {
					if (response.error) {
						console.error(response.error);
					} else {
						app.userController.getUser().userId = response.result._id;
						app.userController.getUser().whoami._id = response.result._id;
						app.userController.setUserLocally();
					}
				});
			}
		},
		setUserPosition: function(positions) {
			kuzzle.create(CABBLE_COLLECTION_POSITIONS, positions, false);
		},
		getKuzzle: function(positions) {
			return kuzzle;
		},
		/**
		 * - Gets the top-left and bottom-right corners coordinates from google maps
		 * - Creates a kuzzle filter including geolocalization bounding box
		 * - Unsubscribe from previous room if we were listening to one
		 * - Subscribe to kuzzle with the new filter
		 */
		refreshKuzzleFilter: function() {
			var bound = app.gisController.getMapBounds();
			var user  = app.userController.getUser();

			var filterUserType = user.whoami.type === 'taxi' ? 'customer' : 'taxi';
			var filter =  {
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

			if (positionsRoom) {
				kuzzle.unsubscribe(positionsRoom);
			}

			//console.dir(filter);
			positionsRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter, function(response) {
				if (response.error) {
					console.error(response.error);
				}
        console.dir("pos" );
        console.dir(response );
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

				if (customersRoom) {
					kuzzle.unsubscribe(customersRoom);
					customersRoom = null;
				}
			} else if (userType === 'taxi') {
				refreshInterval = 1000;

				if (taxisRoom) {
					kuzzle.unsubscribe(taxisRoom);
					taxisRoom = null;
				}
			}

			if (refreshFilterTimer) {
				clearInterval(refreshFilterTimer);
			}

			var refreshFilterTimer = setInterval(function() {
				this.refreshKuzzleFilter()
			}.bind(this), refreshInterval);
		}
	};

})(app);

app.init();
