////////////////////////user module/////////////////

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
					app.userController.fetchFromLocalStorage().then(function(value) {
						if (value) {
							user = value;
							app.kuzzleController.setUserType(user.whoami.type);
							app.gisController.setUserType(user.whoami.type);
						}
						console.log("##############User initialisation ENDED !#######################");

						if(user.whoami.type)
							app.gisController.closePopupForUser();
						resolve();
					});
				});
		},

		getUser: function() {
			return user;
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
