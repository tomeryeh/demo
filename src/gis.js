//IIFE, module partern,...

(function() {

	//the only global variable added to global scope from gis
	window.gis = GisModule();

	function GisModule() {

		//////////////////privates attributes///////////////////////
		var map;
		var userMarker;
		var userPosition;

		var controlUI;

		var otherItemsMark = []; //depending on the nature of user this is a cab list or customerlist

		var currentWindowClose = null;

		var assocIdToOtherItemsMark = {};

		var iconSize = [38, 38];
		var popupAnchor = [0, -22];
		var taxiIcon = L.icon({
			iconUrl: "assets/img/imagen-taxi.jpg",
			iconSize: iconSize,
			popupAnchor: popupAnchor
		});

		var userIcon = L.icon({
			iconUrl: "assets/img/meeple2.png",
			iconSize: iconSize,
			popupAnchor: popupAnchor
		});

		function CenterControl(controlDiv, map) {

			// Set CSS for the control border
			controlUI = document.createElement('div');
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
			controlText.innerHTML = 'End the ride';

			controlUI.style.display = "none";
			controlUI.appendChild(controlText);

			google.maps.event.addDomListener(controlUI, 'click', function() {
				app.kuzzleController.finishRide();
				controlUI.style.display = "none";
				//map.setCenter(chicago)
			});
		}

		function createUserMark(position) {
			return new Promise(
				function(resolve, reject) {
					var coordinates = [position.coords.latitude, position.coords.longitude];
					map.setView(coordinates, 15);

					var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

					window.setTimeout(function() {
						map.setView(coordinates, 15);
					}, 3000);

					var contentString = "";

					var taxiSearchText = "looking for a customer...";
					var customerSearchText = "looking for a taxi...";

					var wanabeCustomerTextForTaxi = "No ! I need a ride";
					var wanabeTaxiForCustomer = "No ! i'm looking for a customer";

					var leftText;
					var rightText;
					var icon;

					if (userType) {
						if (userType === "taxi") {
							leftText = wanabeCustomerTextForTaxi;
							rightText = taxiSearchText;
							icon = taxiIcon;
						}

						if (userType === "customer") {
							leftText = customerSearchText;
							rightText = wanabeTaxiForCustomer;
							icon = userIcon;
						}
					} else {
						leftText = "i need a ride";
						rightText = "i'm looking for a customer";
					}

					var contentString = "Hello from Cabble ! what can i do for you ?";
					contentString += '<button id="left_cabble">' + leftText + '</button>';
					contentString += '<button id="right_cabble" >' + rightText + '</button>';

					var popup = L.popup().setContent(contentString);

					userMarker = L.marker(coordinates, {
						icon: icon
					});

					map.on("popupopen", function(eventPopup) {
						var popup = eventPopup.popup;
						console.log(popup);
						var left_cabble = document.querySelector("#left_cabble");
						var right_cabble = document.querySelector("#right_cabble");

						var userType = app.userController.getUser() && app.userController.getUser().whoami.type;
						if (!userType) {
							right_cabble.disabled = false;
							left_cabble.disabled = false;
						} else {
							right_cabble.disabled = (userType == "taxi");
							left_cabble.disabled = !(userType == "taxi");
						}

						left_cabble.addEventListener("click", function() {
							userMarker.setIcon(userIcon);
							app.kuzzleController.setUserType("customer");
							left_cabble.innerHTML = customerSearchText;
							right_cabble.innerHTML = wanabeTaxiForCustomer;
							right_cabble.disabled = false;
							left_cabble.disabled = true;
							map.closePopup(popup);
						});

						right_cabble.addEventListener("click", function() {
							userMarker.setIcon(taxiIcon);
							app.kuzzleController.setUserType("taxi");
							left_cabble.innerHTML = wanabeCustomerTextForTaxi
							right_cabble.innerHTML = taxiSearchText;
							right_cabble.disabled = true;
							left_cabble.disabled = false;
							map.closePopup(popup);
						});

					});

					userMarker.addTo(map)
						.bindPopup(popup)
						.openPopup();
					resolve();
				}
			);
		};

		//////////////////public methodes (i.e exposed) ///////////////////////
		return {
			resetAllMarks: function() {

				console.log("reset all marks ...");

				return new Promise(
					function(resolve, reject) {
						var resolver = Promise.pending();
						otherItemsMark.forEach(
							function(marker) {
								marker.setMap(null);
								console.dir(marker.infowindow);
								google.maps.event.clearListeners(marker.infowindow, 'click');
							}
						);

						assocIdToOtherItemsMark = {};

						if (userMarker)
							userMarker.setMap(null);

						if (navigator.geolocation) {
							browserSupportFlag = true;
							navigator.geolocation.getCurrentPosition(function(position) {
								createUserMark(position).then(function() {
									console.log("...reset all marks ended");
									resolve();
								});
							}, function() {
								map.setCenter(defaultCoord);
								console.log("...reset all marks ended");
								resolve();
							});
						}
					}
				);
			},

			addPosition: function(position, type, id) {

				var contentString;
				var otherMarker;
				var infowindow;
				var gmapPos = new google.maps.LatLng(position.lat, position.lon);

				function toggleVisible() {
					if (visible) {
						if (currentWindowClose)
							currentWindowClose();
					} else {
						if (currentWindowClose)
							currentWindowClose();
						infowindow.open(map, otherMarker);

						currentWindowClose = function() {
							infowindow.close(map, userMarker)
						};
					}
					visible = !visible;
				};

				//update 
				if (assocIdToOtherItemsMark[id]) {
					otherMarker = assocIdToOtherItemsMark[id];
					otherMarker.setPosition(gmapPos);
					infowindow = otherMarker.infowindow;
				}
				//creation
				else {
					otherMarker = new google.maps.Marker({
						position: gmapPos,
						icon: getIcon(type),
						animation: google.maps.Animation.DROP
					});

					var proposeText = '<p><a class="propose_cabble" ><span class="bottom">Ask for a ride</span></a></p>';
					var cancelText = '<p><a class="cancel_cabble" ><span class="bottom">Cancel</span></a></p>';

					contentString = '<div id="content_info_item"><div id="siteNotice"></div>';
					if (type === "customer")
						contentString += '<h1 id="firstHeading" class="firstHeading">Propose this customer a ride</h1>';
					else
						contentString += '<h1 id="firstHeading" class="firstHeading">Ask this taxi for a ride</h1>';
					contentString += proposeText;
					contentString += cancelText;
					contentString += '<div id="bodyContent"><p><b>time estimated to meet you : 5 min !</b></p>';

					var contentInfoNode = document.createElement('div');
					contentInfoNode.innerHTML = contentString;
					var infowindow = new google.maps.InfoWindow({
						content: contentInfoNode
					});

					google.maps.event.addListener(infowindow, 'domready', function() {
						var propose_cabble = contentInfoNode.querySelector(".propose_cabble");
						propose_cabble.addEventListener("click", function(event) {
							console.log("proposed to " + id);
							//we are not already sending a request to this taxi/customer
							if (!contentInfoNode.querySelector(".propose_cabble .loader")) {
								var loaderText = '(request send, waiting for response...<img class="loader" src="assets/img/loading.gif"></img>)';
								propose_cabble.innerHTML = propose_cabble.innerHTML + loaderText;
								app.kuzzleController.sendRideProposal(id);
							}
						});

						var cancel_cabble = contentInfoNode.querySelector(".cancel_cabble");
						cancel_cabble.addEventListener("click", function() {
							toggleVisible();
							//otherMarker.setMap(null);
						});
					});

					otherMarker.infowindow = infowindow;
					otherMarker.setMap(map);

					var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

					var visible = (type === userType);
					var visible = true;
					toggleVisible();

					google.maps.event.addListener(otherMarker, 'click', function() {
						toggleVisible();
					});

					google.maps.event.addListener(infowindow, 'closeclick', function() {
						visible = !visible;
					});

					otherItemsMark.push(otherMarker);
					assocIdToOtherItemsMark[id] = otherMarker;
				}

				//getBestCandidate();
			},
			getUserPosition: function() {
				return userMarker.getLatLng();
			},
			getMapBounds: function() {
				var mapBounds = map.getBounds();
				return {
					swCorner: mapBounds.getSouthWest(),
					neCorner: mapBounds.getNorthEast()
				};
			},
			init: function() {

				return new Promise(
					function(resolve, reject) {
						map = L.map('map-canvas').setView([51.505, -0.09], 13);
						http: //a.basemaps.cartocdn.com/light_all/$%7Bz%7D/$%7Bx%7D/$%7By%7D.png
							L.tileLayer('http://a.basemaps.cartocdn.com/light_all//{z}/{x}/{y}.png', {
								//L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ', {
								maxZoom: 18,
								attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
									'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
									'Imagery © <a href="http://mapbox.com">Mapbox</a>',
								id: 'mapbox.streets'
							}).addTo(map);
						resolve();
					});
			},

			showCenterControl: function() {
				controlUI.style.display = "";

			},
			showPopupRideProposal: function(source, target) {

				console.log("we got a rpoposale from gis");

				var markerSource = assocIdToOtherItemsMark[source];
				if (!markerSource) {
					console.log("a ride with a ghost" + source);
					return;
				}
				markerSource.setAnimation(google.maps.Animation.BOUNCE);

				var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

				var titleText = 'You have a ride proposition from this taxi';
				var acceptText = '<p><a class="accept_cabble" ><span class="bottom">Yes, pick me up!</span></a></p>';
				var declineText = '<p><a class="decline_cabble" ><span class="bottom">No, thank you.</span></a></p>';

				if (userType === "taxi") {
					titleText = 'You have a ride proposition from this customer';
					acceptText = '<p><a class="accept_cabble" ><span class="bottom">Yes, I pick you up!</span></a></p>';
					declineText = '<p><a class="decline_cabble" ><span class="bottom">No, sorry.</span></a></p>';
				}

				contentString = '<div id="content_info_item"><div id="siteNotice"></div>';
				contentString += '<h1 id="firstHeading" class="firstHeading">' + titleText + '</h1>';
				contentString += acceptText;
				contentString += declineText;
				//contentString += '<div id="bodyContent"><p><b>time estimated to meet you : 5 min !</b></p>';

				var contentInfoNode = document.createElement('div');
				contentInfoNode.innerHTML = contentString;
				var rideinfowindow = new google.maps.InfoWindow({
					content: contentInfoNode
				});

				if (currentWindowClose)
					currentWindowClose();
				rideinfowindow.open(map, markerSource);

				currentWindowClose = function() {
					rideinfowindow.close(map, markerSource);
				}

				google.maps.event.addListener(rideinfowindow, 'closeclick', function() {
					markerSource.setAnimation(null);
				});

				return new Promise(
					function(resolve, reject) {

						google.maps.event.addListener(rideinfowindow, 'domready', function() {
							var propose_cabble = contentInfoNode.querySelector(".accept_cabble");
							var cancel_cabble = contentInfoNode.querySelector(".decline_cabble");

							propose_cabble.addEventListener("click", function(event) {
								rideinfowindow.close(map, markerSource);
								markerSource.setAnimation(null);
								resolve("accept");
							});

							cancel_cabble.addEventListener("click", function() {
								rideinfowindow.close(map, markerSource);
								markerSource.setAnimation(null);
								resolve("refused");
							});
						});
					});
			}
		};
	};

})();
