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

			cab_cabble.addEventListener("click", function(event) {
				cab_cabble.innerHTML = "Cabble is looking for a customer for you";
				app.kuzzleController.setUserType("cab");
				user_cabble.innerHTML = "I need a ride";
			});
		});
	},
	init: function() {
		//setTimeout(function(){
		this.initUI();
		//}.bind(this),0);

		this.gisController.app = app;

		this.gisController.init()
			.then(app.userController.init) //user from local storage init
			.then(app.kuzzleController.init) //kuzzle init
			.then(
				function() {
					//default type user (must be reomve and change by modal dialog)
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
		userId: false,
		whoami: {
			type: 'customer'

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
			console.log("create user ");
			return new Promise(
				function(resolve, reject) {
					app.userController.getUserLocally().then(function(value) {
						if (value)
							user = JSON.parse(value);

						resolve();
						//setInterval(sendMyPosition.bind(this), 3000);
					});
				})
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
			return resolver.promise;;
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

			var user = app.userController.getUser();

			kuzzle.create(CABBLE_COLLECTION_USERS, "cab", true, function(response) {

				alert(response);
				if (response.error) {
					console.error(response.error);
				} else {
					whoami._id = userId;
				}
			});

			console.log("create kuzlzle ");

			return new Promise(
				function(resolve, reject) {
					// TODO: retrieve userId from localstorage
					var user = app.userController.getUser();
					if (!user.userId) {

						console.log("init user in kuzzle   ");
						kuzzle.create(CABBLE_COLLECTION_USERS, user.whoami, false, function(response) {
							console.log("caaaaaaaalllll ok in socker reuqet");
							if (response.error) {
								console.log("error in socker reuqet");
							} else {
								console.log("ok  in socker reuqet");
								app.userController.getUser().userId = response.result._id;
								app.userController.getUser().whoami._id = response.result._id;
								app.userController.setUserLocally().then(function() {
									console.log("ending kuzzle ");
									//
								});
							}
						});
						resolve();
					};
				});
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
			var user = app.userController.getUser();

			var filterUserType = user.whoami.type === 'cab' ? 'customer' : 'cab';
			var filter = {
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

			positionsRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter, function(response) {
				if (response.error) {
					console.error("error error error " + response.error);
				}
				if (response.action === "create") {
					var other = response.body;
					console.log("create action ");
					console.dir(response);
					app.gisController.addPositions([other.position], response.body.type);
				} else {
					console.log("recive  ");
					console.dir(response);

				}
				// TODO: display or update the received user
			});
		},
		setUserType: function(userType) {
			//if (app.userController.getUser().whoami.type === userType)
			//	return;
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
			} else if (userType === 'cab') {
				refreshInterval = 1000;

				if (taxisRoom) {
					kuzzle.unsubscribe(taxisRoom);
					taxisRoom = null;
				}
			}

			app.gisController.resetAllMarks().then(function() {

				if (refreshFilterTimer)
					clearInterval(refreshFilterTimer);

				this.refreshKuzzleFilter();

				refreshFilterTimer = setInterval(function() {
					this.refreshKuzzleFilter();
				}.bind(this), refreshInterval);
			}.bind(this));
		}
	};

})(app);

app.init();
