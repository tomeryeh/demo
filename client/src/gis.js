//IIFE, module partern,...

(function() {

	//the only global variable added to global scope from gis
	window.gis = GisModule();

	//wait until googlemap is loaded and so initialized our gis instance.
	google.maps.event.addDomListener(window, 'load', function() {
		window.gis.resetGis();
	});

	function GisModule() {

		//////////////////privates attributes///////////////////////
		var map;
		var userMarker;
		var userPosition;

		var defaultCoord = new google.maps.LatLng(40.69847032728747, -73.9514422416687); //NewYork

		function getIcon(userType) {
			return "assets/img/" + (userType === "cab" ? "imagen-taxi.jpg" : "phone.png");
		}

		//////////////////privates methodes///////////////////////

		function generateRandomItems(type, nbRandomItems) {
			var arrayTaxiMarker = [];
			//You must recive an json with arrayTaxiMarker in it

			//this is what we must get from a first call to Kuzzle :

			//get random positions for taxi arround my position
			if (!nbRandomItems)
				nbRandomItems = 10;
			for (var i = 0; i < nbRandomItems; i++) {
				arrayTaxiMarker.push(new google.maps.LatLng(userPosition.lat() + (Math.random() - 0.5) / 100, userPosition.lng() + (Math.random() - 0.5) / 100));
			}

			//2 add marker in map

			for (var i = 0; i < arrayTaxiMarker.length; i++) {
				var taxiMarker = new google.maps.Marker({
					position: arrayTaxiMarker[i],
					title: 'A cab!',
					icon: getIcon(type)
				});
				taxiMarker.setMap(map);
			}

			//3 each time kuzzle found a change, update map
			//see https://developers.google.com/maps/documentation/javascript/markers
		}

		//////////////////public methodes (i.e exposed) ///////////////////////
		return {
			resetGis: function resetGis() {
				var mapOptions = {
					zoom: 16
				};
				map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

				var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

				if (navigator.geolocation) {
					browserSupportFlag = true;
					navigator.geolocation.getCurrentPosition(function(position) {
						userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
						map.setCenter(userPosition);

						userMarker = new google.maps.Marker({
							position: userPosition,
							title: 'You!',
							icon: getIcon(userType)
						});
						userMarker.setMap(map);
						generateRandomItems(userType === "cab" ? "customer" : "cab");

					}, function() {
						map.setCenter(defaultCoord);
					});
				} else {
					map.setCenter(defaultCoord);
				}
			},
			getUserPosition: function() {
				return userPosition;
			},
			getMapBounds: function() {
				var mapBounds = map.getBounds();
				return {
					swCorner: mapBounds.getSouthWest(),
					neCorner: mapBounds.getNorthEast()
				};
			}
		};
	};

})();
