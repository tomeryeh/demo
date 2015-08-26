/**
 *	GIS module
 *	all the GIS specific code (here we use Leaflet) http://leafletjs.com/
 *
 **/

(function() {

	//the only global variable added to global scope from gis
	window.gis = GisModule();

	function GisModule() {

		var map;
		var userMarker;
		var userPosition;

		var controlUI;

		var otherItemsMark = []; //depending on the nature of user this is a cab list or customerlist

		var assocIdToOtherItemsMark = {};

		var iconSize = [38, 38];
		var popupAnchor = [0, -22];
		var taxiIcon = L.icon({
			iconUrl: "assets/img/imagen-taxi.jpg",
			iconSize: iconSize,
			popupAnchor: popupAnchor
		});

		var unknowIcon = L.icon({
			iconUrl: "assets/img/unknown.jpg",
			iconSize: iconSize,
			popupAnchor: popupAnchor
		});

		var userIcon = L.icon({
			iconUrl: "assets/img/meeple2.png",
			iconSize: iconSize,
			popupAnchor: popupAnchor
		});

		function getIcon(type) {
			var icon = unknowIcon;
			if (type === "taxi") {
				icon = taxiIcon;
			}
			if (type === "customer") {
				icon = userIcon;
			}
			return icon;
		};

		function createUserMarker(position) {

			return new Promise(
				function(resolve, reject) {
					var coordinates = [position[0], position[1]];
					map.setView(coordinates, 15);

					var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

					window.setTimeout(function() {
						map.setView(coordinates, 15);
					}, 3000);

					var popup = createUserPopup(userType);

					userMarker = L.marker(coordinates, {}).addTo(map)
						.bindPopup(popup);

					if (!userType)
						userMarker.openPopup();

					userMarker.setIcon(getIcon(userType));

					if (!position) {
						map.fitWorld();
					}
					resolve();
				}.bind(this)
			);
		};

		function createMap(position) {
			return new Promise(
				function(resolve, reject) {
					map = L.map('map-canvas').setView(position, 13);
					setInterval(function() {
						map.panTo(L.latLng(position));
					}, 3000);
					http: //a.basemaps.cartocdn.com/light_all/$%7Bz%7D/$%7Bx%7D/$%7By%7D.png
						L.tileLayer('http://a.basemaps.cartocdn.com/light_all//{z}/{x}/{y}.png', {
							//L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ', {
							maxZoom: 18,
							attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
								'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
								'Imagery © <a href="http://mapbox.com">Mapbox</a>',
							id: 'mapbox.streets'
						}).addTo(map);
					resolve(position);
				}).bind(this);
		};

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

			/*
			google.maps.event.addDomListener(controlUI, 'click', function() {
				app.kuzzleController.finishRide();
				controlUI.style.display = "none";
			});
			*/
		};

		function createUserPopup(userType) {

			var contentString = "";

			var taxiSearchText = "looking for a customer...";
			var customerSearchText = "looking for a taxi...";

			var wanabeCustomerTextForTaxi = "No ! I need a ride";
			var wanabeTaxiForCustomer = "No ! i'm looking for a customer";

			var customerText;
			var taxiText;

			if (userType) {
				if (userType === "taxi") {
					customerText = wanabeCustomerTextForTaxi;
					taxiText = taxiSearchText;
				}

				if (userType === "customer") {
					customerText = customerSearchText;
					taxiText = wanabeTaxiForCustomer;
				}
			} else {
				customerText = "i need a ride";
				taxiText = "i'm looking for a customer";
			}

			var contentPop = document.createElement("div");
			contentPop.appendChild(document.createTextNode("Hello from Cabble ! what can i do for you ?"));

			var btnCustomer = document.createElement("BUTTON");
			btnCustomer.appendChild(document.createTextNode(customerText));

			var btnTaxi = document.createElement("BUTTON");
			btnTaxi.appendChild(document.createTextNode(taxiText));

			contentPop.appendChild(btnCustomer); // Append the text to <button>
			contentPop.appendChild(btnTaxi); // Append the text to <button>

			btnCustomer.addEventListener("click", function(event) {
				userMarker.setIcon(userIcon);
				app.kuzzleController.setUserType("customer");
				btnCustomer.innerHTML = customerSearchText;
				btnTaxi.innerHTML = wanabeTaxiForCustomer;
				btnTaxi.disabled = false;
				btnCustomer.disabled = true;
				map.closePopup(event.popup);
			});

			btnTaxi.addEventListener("click", function() {
				userMarker.setIcon(taxiIcon);
				app.kuzzleController.setUserType("taxi");
				btnCustomer.innerHTML = wanabeCustomerTextForTaxi
				btnTaxi.innerHTML = taxiSearchText;
				btnTaxi.disabled = true;
				btnCustomer.disabled = false;
				map.closePopup(event.popup);
			});

			return L.popup().setContent(contentPop);
		};

		function createPopupRideProposal(source, target, rideProposal) {

			var popupProposeRide = null;

			var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

			var titleText = 'You have a ride proposition from this taxi';
			var acceptMessage = "Yes, pick me up!";
			var cancelMessage = "No, thank you.";

			if (userType === "taxi") {
				titleText = 'You have a ride proposition from this customer';
				acceptMessage = 'Yes, I pick you up!';
				cancelMessage = 'No, sorry.';
			}

			var contentPopup = document.createElement("div");

			var header = document.createElement("h1");
			header.appendChild(document.createTextNode(titleText));

			var acceptCabble = document.createElement("p");
			var acceptCabbleButton = document.createElement("button");
			acceptCabbleButton.appendChild(document.createTextNode(acceptMessage));
			acceptCabbleButton.addEventListener("click", function(event) {
				map.closePopup(popupProposeRide);
				app.kuzzleController.acceptRideProposal(rideProposal);
			});

			var cancelCabble = document.createElement("p");
			var cancelCabbleButton = document.createElement("button");
			cancelCabbleButton.appendChild(document.createTextNode(cancelMessage));
			cancelCabbleButton.addEventListener("click", function(event) {
				map.closePopup(popupProposeRide);
				app.kuzzleController.declineRideProposal(rideProposal);
			});

			contentPopup.appendChild(header);
			contentPopup.appendChild(acceptCabbleButton);
			contentPopup.appendChild(cancelCabbleButton);

			return L.popup().setContent(contentPopup);
		};

		function createProposeRidePopup(type, id) {
			var popupProposeRide = null;

			var proposeCabble = document.createElement("p");
			var proposeCabbleButton = document.createElement("button");
			//proposeCabbleButton.setAttribute("id", "acceptCabbleButton");
			proposeCabbleButton.appendChild(document.createTextNode("Ask for a ride"));
			proposeCabble.appendChild(proposeCabbleButton);
			proposeCabble.addEventListener("click", function(event) {
				popupContent = popupProposeRide.getContent();
				var loader = document.createElement("img");
				loader.src = "/assets/img/loading.gif";
				proposeCabbleButton.appendChild(loader);
				app.kuzzleController.sendRideProposal(id);
			});

			var cancelCabble = document.createElement("p");
			var cancelCabbleButton = document.createElement("button");
			cancelCabbleButton.appendChild(document.createTextNode("Cancel"));
			cancelCabble.appendChild(cancelCabbleButton);
			cancelCabble.addEventListener("click", function() {
				map.closePopup(popupProposeRide);
			});

			var contentPopup = document.createElement("div");

			var header = document.createElement("h1");
			var contentHeader = "";
			if (type === "customer")
				contentHeader += 'Propose this customer a ride';
			else
				contentHeader += 'Ask this taxi for a ride';
			header.appendChild(document.createTextNode(contentHeader));

			contentPopup.appendChild(header);
			contentPopup.appendChild(proposeCabble);
			contentPopup.appendChild(cancelCabble);
			popupProposeRide = L.popup().setContent(contentPopup);

			return popupProposeRide;

		};

		function getGeoLoc() {
			return new Promise(
				function(resolve, reject) {
					if (navigator.geolocation) {
						browserSupportFlag = true;
						navigator.geolocation.getCurrentPosition(function(position) {
							resolve([position.coords.latitude, position.coords.longitude]);
						}, function() {
							//TODO ask for user to give it a position
							reject();
						});
					}
				}
			);
		};
		return {
			resetAllMarks: function() {
				console.log("allmarks");
				console.log(otherItemsMark);
				return new Promise(
					function(resolve, reject) {
						var resolver = Promise.pending();
						otherItemsMark.forEach(
							function(marker) {
								marker.closePopup();
								map.removeLayer(marker);
							}
						);
						otherItemsMark = [];
						assocIdToOtherItemsMark = {};
						resolve();
					}.bind(this));
			},

			addMarker: function(position, type, id) {
				var contentString;
				var marker;

				//update marker
				if (assocIdToOtherItemsMark[id]) {
					marker = assocIdToOtherItemsMark[id];
					marker.setLatLng(L.latLng(position.lat, position.lon));
					infowindow = marker.infowindow;
				}
				//create marker
				else {
					var popup = createProposeRidePopup(type, id);
					marker = L.marker([position.lat, position.lon], {}).addTo(map)
						.bindPopup(popup)
						.openPopup();

					assocIdToOtherItemsMark[id] = marker;
					otherItemsMark.push(marker);
				}

				marker.setIcon(getIcon(type));
			},

			getUserPosition: function() {
				return userMarker.getLatLng();
			},
			setUserType: function(type) {
				userMarker.setIcon(getIcon(type));
			},
			getMapBounds: function() {
				var mapBounds = map.getBounds();
				return {
					swCorner: mapBounds.getSouthWest(),
					neCorner: mapBounds.getNorthEast()
				};
			},

			init: function() {
				return getGeoLoc().
				then(createMap).
				then(createUserMarker);
			},

			closePopupForUser: function() {
				userMarker.closePopup();
			},

			showCenterControl: function() {
				//TODO show central control
				//controlUI.style.display = "";
			},
			showPopupRideProposal: function(source, target, rideProposal) {
				var popupProposeRide = createPopupRideProposal(source, target, rideProposal);
				var markerSource = assocIdToOtherItemsMark[source];
				if (!markerSource) {
					console.log("a ride with a ghost" + source);
					return;
				}
				markerSource
					.bindPopup(popupProposeRide)
					.openPopup();
			}
		};
	};

})();
