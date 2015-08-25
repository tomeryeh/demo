var app = {
	gisController: gis,
	kuzzleController: kuzzleController,
	userController: userController,

	init: function() {

		//everybody know app
		this.gisController.app = app;
		this.userController.app = app;
		this.kuzzleController.app = app;

		console.log("##############Cabble initialisation START !#######################");
		//
		this.gisController.init()
			//get user info from localstorage
			.then(app.userController.init)
			//get the GPS user location add the user marker with position and type  (show "?" icon" if no type)
			.then(app.gisController.resetAllMarks.bind(app.gisController))
			//kuzzle listen to our app
			.then(app.kuzzleController.init)
			.then(
				function() {
					setInterval(app.kuzzleController.sendMyPosition.bind(app.kuzzleController), 3000);
					console.log("##############Cabble initialisation ENDED !#######################");
					//default type user (must be remove and change by modal dialog)
					//this.kuzzleController.setUserType("customer");
				}
			).
		catch(function(e) {
			console.error(e);
		});

	}
};

app.init();
