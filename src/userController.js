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
					userController.fetchFromLocalStorage().then(function(value) {
						if (value)
							user = value;

						if (user.whoami.type)
							gisController.closePopupForUser();
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
			return this.setInLocalStorage();
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
		fetchFromLocalStorage: function() {
			return new Promise(
				function(resolve, reject) {
					var resolver = Promise.pending();
					localforage.getItem('cable_user')
						.then(function(value) {
							resolve(JSON.parse(value));
						});
				});

		},
		setInLocalStorage: function() {
			var resolver = Promise.pending();
			var availability = this.isAvailable();
			//we do not persist the availability status
			this.setAvailable(true);
			localforage.setItem('cable_user', JSON.stringify(user))
				.then(function() {
					this.setAvailable(availability);
					resolver.resolve();
				}.bind(this));
			return resolver.promise;
		}
	};

})();
