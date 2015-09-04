/**
 *	User Controller
 *  fetch user data from localstorage
 * 	id for Kuzzle communication, 
 *  type (taxi or customer)
 *  isAvailable (this state is not persisted) do user is currently in ride or not.
 **/

window.userController = (function() {

	var user = {
		userId: null,
		whoami: {
			type: '',
			available: true
		},
	};

	return {
		init: function() {
			return new Promise(
				function(resolve, reject) {
					userController.fetchFromSessionStorage().then(function(value) {
						if (value)
							user = value;
						if (user.whoami.type) {
							gisController.onUserChangeType();
							gisController.closePopupForUser();
						}
						resolve();
					});
				});
		},
		getUser: function() {
			return user;
		},
		getUserType: function() {
			return user.whoami.type;
		},
		/** 
		 * @return a Promise
		 */
		setUserType: function(type) {
			user.whoami.type = type;
			return this.setInSessionStorage();
		},
		getUserId: function() {
			return user.whoami._id;
		},
		isAvailable: function() {
			return user.whoami.available !== undefined || user.whoami.available;
		},
		setAvailable: function(available) {
			user.whoami.available = available;
		},
		/**
		 * type candidate is "taxi" if user is a "customer" and vice versa.
		 *
		 **/
		getCandidateType: function() {
			return this.getUserType() === "taxi" ? "customer" : "taxi";
		},
		fetchFromSessionStorage: function() {
			return new Promise(
				function(resolve, reject) {
					var data = null;
					if(sessionStorage)
						data = sessionStorage.cable_user;
					if(data)
						data = JSON.parse(data)
					resolve(data);
				}
			);
		},
		setInSessionStorage: function() {
			return new Promise(
				function(resolve, reject) {
					var availability = this.isAvailable();
					if(!sessionStorage)
						resolve();

					this.setAvailable(true);
					sessionStorage.cable_user = JSON.stringify(user);
					this.setAvailable(availability);
					resolve();
				}.bind(this)
			);
		}
	};
})();
