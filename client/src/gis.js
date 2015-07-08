//IIFE, module partern,...

(function() {

	//the only global variable added to global scope
	window.gis = GisModule();

	//wait until googlemap is loaded and so initialized our gis instance.
	google.maps.event.addDomListener(window, 'load', function() {
		window.gis.initializeGis();
	});

	function GisModule() {
		var map;
		var userMarker;
		var userPosition;
		var defaultCoord = new google.maps.LatLng(40.69847032728747, -73.9514422416687); //NewYork

		function generateRandomCabs() {
			var arrayTaxiMarker = [];
			//You must recive an json with arrayTaxiMarker in it

			//this is what we must get from a first call to Kuzzle :

			//get random positions for taxi arround my position
			var nbRandomItems = 10;
			for (var i = 0; i < nbRandomItems; i++) {
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
		}

		/**
		 * - Gets the top-left and bottom-right corners coordinates from google maps
		 * - Creates a kuzzle filter including geolocalization bounding box
		 * - Unsubscribe from previous room if we were listening to one
		 * - Subscribe to kuzzle with the new filter
		 */
		function refreshKuzzleFilter() {
			var kuzzle = api.kuzzleController.getKuzzle();
			var mapBounds = map.getBounds();
			var swCorner = mapBounds.getSouthWest();
			var neCorner = mapBounds.getNorthEast();

			var user = app.userController.getUser();

			var filterUserType = user.whoami.type === 'taxi' ? 'customer' : 'taxi';
			var filter = {
				filter: {
					and: [{
						term: {
							type: filterUserType
						}
					}, {
						geoBoundingBox: {
							position: {
								top_left: {
									lat: neCorner.lat(),
									lon: swCorner.lng()
								},
								bottom_right: {
									lat: swCorner.lat(),
									lon: neCorner.lng()
								}
							}
						}
					}]
				}
			};

			if (positionsRoom) {
				kuzzle.unsubscribe(positionsRoom);
			}

			console.dir(filter);
			positionsRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter, function(response) {
				if (response.error) {
					console.error(response.error);
				}

				// TODO: display or update the received user
			});
		}

		function generateRandomCabs() {
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
		}

		/**
		 * - Gets the top-left and bottom-right corners coordinates from google maps
		 * - Creates a kuzzle filter including geolocalization bounding box
		 * - Unsubscribe from previous room if we were listening to one
		 * - Subscribe to kuzzle with the new filter
		 */
		function refreshKuzzleFilter() {
			var
				mapBounds = map.getBounds(),
				swCorner = mapBounds.getSouthWest(),
				neCorner = mapBounds.getNorthEast(),
				filterUserType = whoami.type === 'taxi' ? 'customer' : 'taxi',
				filter = {
					filter: {
						and: [{
							term: {
								type: filterUserType
							}
						}, {
							geoBoundingBox: {
								position: {
									top_left: {
										lat: neCorner.lat(),
										lon: swCorner.lng()
									},
									bottom_right: {
										lat: swCorner.lat(),
										lon: neCorner.lng()
									}
								}
							}
						}]
					}
				};

			if (positionsRoom) {
				kuzzle.unsubscribe(positionsRoom);
			}

			console.dir(filter);
			positionsRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter, function(response) {
				if (response.error) {
					console.error(response.error);
				}

				// TODO: display or update the received user
			});
		}

		return {
			initializeGis: function initializeGis() {
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
						generateRandomCabs();

					}, function() {
						map.setCenter(defaultCoord);
					});
				} else {
					map.setCenter(defaultCoord);
				}
			},
			getUserPosition: function() {
				return userPosition;
			}
		};
	};

})();
