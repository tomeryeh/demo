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
			console.error("hola get icon " + userType);
			var image = "unknown.jpg";
			if (userType === "taxi")
				image = "imagen-taxi.jpg";
			if (userType === "customer")
				image = "meeple2.png";

			return "assets/img/" + image;
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

		function createUserMark(position) {
			return new Promise(
				function(resolve, reject) {
					var userType = app.userController.getUser() && app.userController.getUser().whoami.type;
					userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
					map.setCenter(userPosition);

					userMarker = new google.maps.Marker({
						position: userPosition,
						title: 'You!',
						icon: getIcon(userType)
					});

					userMarker.setMap(map);

					var contentString = "";

					var customerText = "I need a ride";
					var taxiText = "I'm looking for a customer";

					if (userType) {
						if (userType === "taxi") {
							taxiText = "Cabble is looking for a customer for you";
						}

						if (userType === "customer") {
							customerText = "Cabble is looking for a taxi";
						}
					}

					var contentString = "Hello from Cabble ! what can i do for you ?";
					contentString += '<div class="btn-group btn-group-justified" role="group" aria-label="...">';
					contentString = '<div class="btn-group" role="group">';
					contentString = '<button id="user_cabble" type="button" class="btn btn-default">' + customerText + '</button>';
					contentString += '</div>';

					contentString += '<div class="btn-group" role="group">'
					contentString += '<button id="cab_cabble"  type="button" class="btn btn-default">' + taxiText + '</button>';
					contentString += '</div>'
					contentString += '</div>';

					var infowindow = new google.maps.InfoWindow({
						content: contentString
					});

					google.maps.event.addListener(infowindow, 'domready', function() {
						///kick and dirty ui logic !
						var user_cabble = document.querySelector("#user_cabble");
						var cab_cabble = document.querySelector("#cab_cabble");
						user_cabble.addEventListener("click", function(event) {
							user_cabble.innerHTML = "Cabble is looking for your ride";
							app.kuzzleController.setUserType("customer");
							cab_cabble.innerHTML = "I'm looking for a customer";
							resolve();
						});

						cab_cabble.addEventListener("click", function() {
							cab_cabble.innerHTML = "Cabble is looking for a customer for you";
							app.kuzzleController.setUserType("taxi");
							user_cabble.innerHTML = "I need a ride";
							resolve();
						});

					});

					var visible = !userType;

					google.maps.event.addListener(userMarker, 'click', function() {
						if (visible)
							infowindow.close(map, userMarker);
						else
							infowindow.open(map, userMarker);
						visible = !visible;
					});

					if (!userType) {
						infowindow.open(map, userMarker);
					} else {
						console.log("we have a type " + userType);
						//app.kuzzleController.setUserType(userType);
						resolve();
					}
				}
			);
		};

		//////////////////public methodes (i.e exposed) ///////////////////////
		return {
			resetAllMarks: function() {

				return new Promise(
					function(resolve, reject) {
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
								createUserMark(position).then(resolve);
							}, function() {
								map.setCenter(defaultCoord);
								resolve();
							});
						}
					}
				);
			},

			addPositions: function(positions, type) {
				positions.forEach(function(position) {

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

				console.log("gis controller creation");
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
							console.log("gis controller ended");

							resolve();
							//resolverG.resolve();
						})
					})
			}
		};
	};

})();
