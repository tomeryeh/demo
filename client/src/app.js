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

			window.onload = function() {
				//your code
				var user_cabble = document.querySelector("#user_cabble");
				user_cabble.addEventListener("click", function(event) {
					user_cabble.innerHTML = "Cabble is looking for your ride";

					app.kuzzleController.setUserType("customer");
				});

				var cab_cabble = document.querySelector("#cab_cabble");
				cab_cabble.addEventListener("click", function(event) {
					cab_cabble.innerHTML = "Cabble is looking for a customer for you";
					app.kuzzleController.setUserType("taxi");
				});
			}

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
    setUserType: function (userType) {
      var refreshInterval;

      app.userController.getUser().whoami.type = userType;
      app.userController.setUserLocally();
      kuzzle.update(CABBLE_COLLECTION_USERS, app.userController.getUser().whoami);

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
         app.gisController.refreshKuzzleFilter()
      }, refreshInterval);
    }
	};

})(app);

app.init();
