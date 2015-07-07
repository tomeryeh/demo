var app = {
	gisController: gis,
	kuzzleController: {},
	userController: {},
	init: function() {

		//gis is already define because script is load in order
		this.gisController.app = app;
		//first try to found user info in local storage
		this.userController.init();
		//init Kuzzle with possibiliy existing user
		this.kuzzleController.init();
	}
};

////////////////////////user module/////////////////
var userModule = (function UserModule(app) {

	var user = {
		userId: false,
		whoami: {
			type: '',
			_id: false
		}
	};

	var app = app;

	/**
	 * Create myself in Kuzzle or update my position in it.
	 *
	 */
	function sendMyPosition() {

		//console.log("send my position");
		//console.log(user);
		app.kuzzleController.setUserPosition({
			userId: user.whoami._id,
			type: user.whoami.type,
			position: app.gisController.getUserPosition()
		});
	}

	/**
	 * Tell Kuzzle what type of user I am (a cab or a customer)
	 *
	 * @param userType
	 */
	function setUserType(userType) {
		var refreshInterval;

		whoami.type = userType;
		kuzzle.update(CABBLE_COLLECTION_USERS, whoami);

		if (userType === 'customer') {
			refreshInterval = 60000;

			if (customersRoom) {
				kuzzle.unsubscribe(customersRoom);
				customersRoom = null;
			}
		} else if (userType === 'taxi') {
			refreshInterval = 10000;

			if (taxisRoom) {
				kuzzle.unsubscribe(taxisRoom);
				taxisRoom = null;
			}
		}

		if (refreshFilterTimer) {
			clearInterval(refreshFilterTimer);
		}

		refreshFilterTimer = setInterval(function() {
			refreshKuzzleFilter()
		}, refreshInterval);
	}

	app.userController = {
		init: function() {
			this.getUserLocally(
				function(value) {
					if(value){
						user = JSON.parse(value);
						//console.dir("data from storage");
						//console.dir(user);
						console.dir(user);
						
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
			console.log("saving user ");
			//console.log(user);
			localforage.setItem('cable_user', JSON.stringify(user));
		}
	}

})(app);

////////////////////////kuzzle module/////////////////
(function KuzzleModule(app) {

	var KUZZLE_URL = 'api.uat.kuzzle.io:7512';
	var CABBLE_COLLECTION_POSITIONS = 'coding-challenge-cabble-positions';
	var CABBLE_COLLECTION_USERS = 'coding-challenge-cabble-users';

	var app = app;

	var kuzzle = new Kuzzle(KUZZLE_URL);

	var customersRoom;
	var taxisRoom;
	var positionsRoom;
	var refreshFilterTimer;

	/**
	 * Cabble initialization:
	 *  - Connect to Kuzzle
	 *  - Get the User ID from Local Storage. If it doesn't exist, create one with Kuzzle
	 *
	 */

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
		}
	};

})(app);

app.init();
