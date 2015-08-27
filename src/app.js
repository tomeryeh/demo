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
		//init GIS component to get GPS user location add init map
		this.gisController.init()
			//init user component to listen to local saved user info (i.e userid and type:=[taxi,customer])
			.then(app.userController.init)
			//init kuzzle component to listen for adding candidates changing and rides states
			.then(app.kuzzleController.init)
			.then(
				function() {
					setInterval(app.kuzzleController.sendMyPosition.bind(app.kuzzleController), 3000);
					console.log("##############Cabble initialisation ENDED !#######################");
				}
			).
		catch(function(e) {
			console.error(e);
		});

	}
};

app.init();
