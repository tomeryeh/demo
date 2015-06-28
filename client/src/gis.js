//IIFE, module partern,...

(function gisLoading() {

	var map;

	var userMarker;
	var userPosition;
	var defaultCoord = new google.maps.LatLng(40.69847032728747, -73.9514422416687); //NewYork

	var taxiCoordinates

	console.log("coucou");

	function initializeGis() {
		var mapOptions = {
			zoom: 16
		};
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

		if (navigator.geolocation) {
			browserSupportFlag = true;
			navigator.geolocation.getCurrentPosition(function(position) {
				userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				map.setCenter(userPosition);

				userMarker = new google.maps.Marker({
					position: userPosition,
					title: 'You!',
					icon: "assets/img/phone.png"
				});
				userMarker.setMap(map);
				plugToKuzzle();
			}, function() {
				map.setCenter(defaultCoord);
			});
		} else {
			map.setCenter(defaultCoord);
		}
	};

	function plugToKuzzle() {

		//1 init websocket on kuzzle
		//use userPosition and look for taxi around it.

		var arrayTaxiMarker = [];
		//You must recive an json with arrayTaxiMarker in it

		//this is what we must get from a first call to Kuzzle :

		//get random positions for taxi arrounf my position
		for (var i = 0; i < 10; i++) {
			arrayTaxiMarker.push(new google.maps.LatLng(userPosition.lat() + (Math.random() - 0.5) / 100, userPosition.lng() + (Math.random() - 0.5) / 100));
		}

		//2 add marker in map

		for (var i = 0; i < arrayTaxiMarker.length; i++) {
			var taxiMarker = new google.maps.Marker({
				position: arrayTaxiMarker[i],
				title: 'A taxi!',
				icon: "assets/img/imagen-taxi.jpg"
			});
			taxiMarker.setMap(map);
		}

		//3 each time kuzzle found a change, update map
		//see https://developers.google.com/maps/documentation/javascript/markers
	};

	//waiting until googlempa is initialize as GIS service
	google.maps.event.addDomListener(window, 'load', initializeGis);

})();
