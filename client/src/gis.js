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
		var otherItemsMark= [];

		function getIcon(userType) {
			return "assets/img/" + (userType === "cab" ? "imagen-taxi.jpg" : "phone.png");
		}

		//////////////////privates methodes///////////////////////

		function generateRandomItems(type, nbRandomItems) {
			var otherItemsCoord = [];
			otherItemsMark= [];
			//You must recive an json with arrayTaxiMarker in it

			//this is what we must get from a first call to Kuzzle :

			//get random positions for taxi arround my position
			if (!nbRandomItems)
				nbRandomItems = 10;
			for (var i = 0; i < nbRandomItems; i++) {
				otherItemsCoord.push(new google.maps.LatLng(userPosition.lat() + (Math.random() - 0.5) / 100, userPosition.lng() + (Math.random() - 0.5) / 100));
			}

			//2 add marker in map

			for (var i = 0; i < otherItemsCoord.length; i++) {
				var otherMarker = new google.maps.Marker({
					position: otherItemsCoord[i],
					//title: 'A cab!',
					icon: getIcon(type),
					animation: google.maps.Animation.DROP
				});

				otherMarker.setMap(map);
				otherItemsMark.push(otherMarker);
			}

			//console.log(map.getMarkers());

			//3 each time kuzzle found a change, update map
			//see https://developers.google.com/maps/documentation/javascript/markers
		}

		function getBestCandidate() {


			var nearestDist = 99999;
			var nearestItem = null;
			console.log(otherItemsMark);
			
			otherItemsMark.forEach(function(n){
			//	console.log(n);
				var distCur = Math.pow(
					userPosition.lat()-
					n.position.lat(),2) +
					 Math.pow(userPosition.lng()
					-n.position.lng(),2);
				
				if(distCur < nearestDist 
					//&& nearestDist > 0.0001
					){
					nearestDist = distCur;
					nearestItem = n;
				}
			}.bind(this));

			console.log("distCur"  + Math.sqrt(nearestDist));

			var contentString = '<div id="content"><div id="siteNotice"></div>' +
				'<h1 id="firstHeading" class="firstHeading">Available ! </h1>' +
				'<div id="bodyContent"><p><b>time estimated to meet you : 5 min !</b></p>' +
				'<p>Tel : 06 77 86 66 54' + '</p>' +
				'</div></div>';

			var infowindow = new google.maps.InfoWindow({content: contentString});

			if(nearestItem)
				infowindow.open(map, nearestItem);
		}

		function CenterControl(controlDiv, map) {

			// Set CSS for the control border
			var controlUI = document.createElement('div');
			controlUI.style.backgroundColor = '#fff';
			controlUI.style.border = '2px solid #fff';
			controlUI.style.borderRadius = '3px';
			controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
			controlUI.style.cursor = 'pointer';
			//controlUI.style.marginBottom = '22px';
			controlUI.style.textAlign = 'center';
			controlUI.title = 'options for Cabble';
			controlDiv.appendChild(controlUI);

			// Set CSS for the control interior
			var controlText = document.createElement('div');
			controlText.style.color = 'rgb(25,25,25)';
			controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
			controlText.style.fontSize = '16px';
			controlText.style.lineHeight = '38px';
			controlText.style.paddingLeft = '5px';
			controlText.style.paddingRight = '5px';
			controlText.innerHTML = 'Cabble Menu';
			controlUI.appendChild(controlText);

			// Setup the click event listeners: simply set the map to
			// Chicago
			google.maps.event.addDomListener(controlUI, 'click', function() {
				//map.setCenter(chicago)
				console.log("click on menu");
			});
		}

		//////////////////public methodes (i.e exposed) ///////////////////////
		return {
			resetGis: function resetGis() {
				var mapOptions = {
					zoom: 16,
					panControl: false,
					zoomControl: false,
					streetViewControl: false,
					scaleControl: false
				};

				map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

				var centerControlDiv = document.createElement('div');
				var centerControl = new CenterControl(centerControlDiv, map);

				centerControlDiv.index = 1;
				map.controls[google.maps.ControlPosition.TOP_LEFT].push(centerControlDiv);

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
						getBestCandidate();

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
