/**
 *	User module
 *	Model user (type and id)
 *  fetch user data from localstorage
 *
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
			console.log("##############User initialisation START !#######################");
			return new Promise(
				function(resolve, reject) {
					userController.fetchFromLocalStorage().then(function(value) {
						if (value) {
							user = value;
							kuzzleController.setUserType(user.whoami.type);
						}
						console.log("##############User initialisation ENDED !#######################");

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
		getCandidateType: function() {
			return user.whoami.type === "taxi" ? "customer" : "taxi";
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
			localforage.setItem('cable_user', JSON.stringify(user))
				.then(function() {
					resolver.resolve();
				});
			return resolver.promise;
		}

	};

})();
