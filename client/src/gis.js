//IIFE, module partern,...

(function() {

	//the only global variable added to global scope from gis
	window.gis = GisModule();

	function GisModule() {

		//////////////////privates attributes///////////////////////
		var map;
		var userMarker;
		var userPosition;

		var defaultCoord = new google.maps.LatLng(40.69847032728747, -73.9514422416687); //NewYork
		var otherItemsMark = []; //depending on the nature of user this is a cab list or customerlist

		function getIcon(userType) {
			return "assets/img/" + (userType === "cab" ? "imagen-taxi.jpg" : "meeple2.png");
		}

		//////////////////privates methodes///////////////////////

		function generateRandomItems(type, nbRandomItems) {
			var otherItemsCoord = [];
			otherItemsMark = [];
			//You must recive an json with arrayTaxiMarker in it

			//this is what we must get from a first call to Kuzzle :

			//get random positions for taxi arround my position
			if (!nbRandomItems)
				nbRandomItems = 10;
			for (var i = 0; i < nbRandomItems; i++) {
				otherItemsCoord.push(new google.maps.LatLng(userPosition.lat() + (Math.random() - 0.5) / 100, userPosition.lng() + (Math.random() - 0.5) / 100));
			}

		};

		function getBestCandidate() {

			var nearestDist = 99999;
			var nearestItem = null;

			otherItemsMark.forEach(function(n) {
				var distCur = Math.pow(
						userPosition.lat() -
						n.position.lat(), 2) +
					Math.pow(userPosition.lng() - n.position.lng(), 2);

				if (distCur < nearestDist
					//&& nearestDist > 0.0001
				) {
					nearestDist = distCur;
					nearestItem = n;
				}
			}.bind(this));

			//console.log("distCur" + Math.sqrt(nearestDist));

			var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

			var contentString = "";
			if (userType === "customer") {
				contentString = '<div id="content_info_item"><div id="siteNotice"></div>' +
					'<h1 id="firstHeading" class="firstHeading">Available ! </h1>' +
					'<div id="bodyContent"><p><b>time estimated to meet you : 5 min !</b></p>' +
					'<p><a href="tel:[phone number]"><span class="bottom">Call us now</span></a></p>' +
					'</div></div>';

			} else {
				contentString = '<div onload="myFunction()" id="content_info_item"><div id="siteNotice"></div>' +
					'<h1 id="firstHeading" class="firstHeading">I need a ride ! </h1>' +
					'<div id="bodyContent"><p><b>I go to the Millenaires ! any cab ?</b></p>' +
					'<p><a href="tel:[phone number]"><span class="bottom">Call me now</span></a></p>' +
					'</div></div>';
			}

			var infowindow = new google.maps.InfoWindow({
				content: contentString
			});
			google.maps.event.addListener(infowindow, 'domready', function() {
				document.querySelector("#content_info_item").parentNode.parentNode.parentNode.parentNode.style.opacity = 0.8;
			});

			if (nearestItem)
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
			//	controlUI.appendChild(controlText);

			google.maps.event.addDomListener(controlUI, 'click', function() {
				//map.setCenter(chicago)
			});
		}

		//////////////////public methodes (i.e exposed) ///////////////////////
		return {
			resetAllMarks: function() {
				var resolver = Promise.pending();
				otherItemsMark.forEach(
					function(marker) {
						marker.setMap(null);
					}
				);

				if (userMarker)
					userMarker.setMap(null);

				if (navigator.geolocation) {
					browserSupportFlag = true;
					navigator.geolocation.getCurrentPosition(function(position) {
						var userType = app.userController.getUser() && app.userController.getUser().whoami.type;
						userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
						map.setCenter(userPosition);

						userMarker = new google.maps.Marker({
							position: userPosition,
							title: 'You!',
							icon: getIcon(userType)
						});
						userMarker.setMap(map);
						resolver.resolve();

					}, function() {
						map.setCenter(defaultCoord);
						resolver.resolve();
					});
				}
				return resolver.promise;
			},

			addPositions: function(positions, type) {
				positions.forEach(function(position) {
					console.log("type" + type);
					//console.dir(position);

					var gmapPos = new google.maps.LatLng(position.lat, position.lon);
					var otherMarker = new google.maps.Marker({
						position: gmapPos,
						icon: getIcon(type),
						animation: google.maps.Animation.DROP
					});

					otherMarker.setMap(map);
					otherItemsMark.push(otherMarker);
				});

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
			},
			init: function() {

				console.log("create gis ");
				//this.app = app;
				//var resolverG = Promise.pending();
				return new Promise(
					function(resolve, reject) {
						google.maps.event.addDomListener(window, 'load', function() {
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
							console.log("ending gis ");

							resolve();
							//resolverG.resolve();
						})
					})
			}
		};
	};

})();
