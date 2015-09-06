(function() {
	//init GIS (Geolocalisation Information System) component to render the map
	//get Geolocalisation to add user on a rendered map.
	gisController.init()
		//load and save use information (id and status in local storage, used as a cheap session like data)
		//set the marker icon on the map if previous status:=["taxi","customer"] is found in local storage
		.then(
			userController.init
		)
		//init kuzzle component to pubsub :
		//	- positions change
		//	- user status change
		//	- ride change
		.then(kuzzleController.init).
	catch(function(e) {
		console.log(e);
	});

})();
