var app = {
	gisController: gisController,
	kuzzleController: kuzzleController,
	userController: userController,

	init: function() {
		//everybody know app
		this.gisController.app = app;
		this.userController.app = app;
		this.kuzzleController.app = app;

		console.log("##############Cabble initialisation START !#######################");
		//init GIS (Geolocalisation Information System) component to render the map
		//get Geolocalisation to add user on a rendered map.
		this.gisController.init()
			//load and save use information (id and status in local storage, used as a cheap session like data)
			//set the marker icon on the map if previous status:=["taxi","customer"] is found in local storage
			.then(app.userController.init)
			//init kuzzle component to pubsub :
			//	- positions change
			//	- user status change
			//	- and ride change
			.then(app.kuzzleController.init);
	}
};

app.init();
