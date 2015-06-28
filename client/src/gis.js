function initialize() {
	var mapOptions = {
		zoom: 16
	};
	var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	if (navigator.geolocation) {
		browserSupportFlag = true;
		navigator.geolocation.getCurrentPosition(function(position) {
			initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			map.setCenter(initialLocation);

			var marker = new google.maps.Marker({
				position: initialLocation,
				//map: map,
				title: 'You!'
			});
			marker.setMap(map);
		}, function() {
			map.setCenter(new google.maps.LatLng(40.69847032728747, -73.9514422416687));
		});
	}
	// Browser doesn't support Geolocation
	else {
		map.setCenter(new google.maps.LatLng(40.69847032728747, -73.9514422416687));
	}
};

google.maps.event.addDomListener(window, 'load', initialize);
