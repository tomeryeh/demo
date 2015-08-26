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
		var userPopup;
		var userPosition;

		var rideControl; //use to manage current ride accepted

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

					userPopup = createUserPopup(userType);

					userMarker = L.marker(coordinates, {}).addTo(map)
						.bindPopup(userPopup);

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
					//setInterval(function() {
					//	map.panTo(L.latLng(position));
					//}, 3000);
					http: //a.basemaps.cartocdn.com/light_all/$%7Bz%7D/$%7Bx%7D/$%7By%7D.png

						//L.tileLayer('http://maps.stamen.com/js/tile.stamen.js?v1.2.3', {
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

		function createRideControl() {
			L.Control.RideControl = L.Control.extend({
				options: {
					position: 'topright',
				},
				onAdd: function(map) {
					var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
					L.DomEvent
						.addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
						.addListener(controlDiv, 'click', L.DomEvent.preventDefault)
						.addListener(controlDiv, 'click', function() {
							app.kuzzleController.finishRide();
							rideControl.removeFrom(map);
						});

					var text = 'End the ride';
					var controlUI = L.DomUtil.create('button', 'leaflet-draw-edit-remove', controlDiv);
					controlUI.setAttribute("class","info_button");
					controlUI.innerHTML = text;
					controlUI.title = text;
					controlUI.href = '#';
					return controlDiv;
				}
			});
			rideControl = new L.Control.RideControl();
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
			btnCustomer.setAttribute("class", "chooseCustomer ok_button")
			btnCustomer.appendChild(document.createTextNode(customerText));

			var btnTaxi = document.createElement("BUTTON");
			btnTaxi.setAttribute("class", "chooseTaxi button")
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
				map.closePopup(popupChooseUserType);
			});

			btnTaxi.addEventListener("click", function() {
				userMarker.setIcon(taxiIcon);
				app.kuzzleController.setUserType("taxi");
				btnCustomer.innerHTML = wanabeCustomerTextForTaxi
				btnTaxi.innerHTML = taxiSearchText;
				btnTaxi.disabled = true;
				btnCustomer.disabled = false;
				map.closePopup(popupChooseUserType);
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
			acceptCabbleButton.setAttribute("class","ok_button");
			acceptCabbleButton.addEventListener("click", function(event) {
				map.closePopup(popupProposeRide);
				app.kuzzleController.acceptRideProposal(rideProposal);
				acceptCabbleButton.disabled = true;
			});

			var cancelCabble = document.createElement("p");
			var cancelCabbleButton = document.createElement("button");
			cancelCabbleButton.setAttribute("class","cancel_button");
			cancelCabbleButton.appendChild(document.createTextNode(cancelMessage));
			cancelCabbleButton.addEventListener("click", function(event) {
				map.closePopup(popupProposeRide);
				app.kuzzleController.declineRideProposal(rideProposal);
				acceptCabbleButton.disabled = false;
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
			proposeCabbleButton.setAttribute("class","ok_button");
			var loader;

			proposeCabbleButton.appendChild(document.createTextNode("Ask for a ride"));
			proposeCabble.appendChild(proposeCabbleButton);
			proposeCabble.addEventListener("click", function(event) {
				popupContent = popupProposeRide.getContent();
				loader = document.createElement("img");
				loader.setAttribute("class", "loader");
				loader.src = "/assets/img/loading.gif";
				proposeCabble.appendChild(loader);
				proposeCabbleButton.disabled = true;
				app.kuzzleController.sendRideProposal(id);
			});

			var cancelCabble = document.createElement("p");
			var cancelCabbleButton = document.createElement("button");
			cancelCabbleButton.setAttribute("class","cancel_button");
			cancelCabbleButton.appendChild(document.createTextNode("Cancel"));
			cancelCabble.appendChild(cancelCabbleButton);
			cancelCabble.addEventListener("click", function() {
				if (loader) {
					loader.remove();
				}
				proposeCabbleButton.disabled = false;
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

							var chrome = window.navigator.userAgent.indexOf("Chrome") > 0;
							console.log(window.navigator.userAgent);
							if(window.navigator.userAgent.indexOf("Chrome") > 0)
								console.log("on chrome");
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
				console.log("set user type " + type);
				userMarker.setIcon(getIcon(type));
				userPopup.getContent().querySelector(".chooseTaxi").disabled = (type ==="taxi");
				userPopup.getContent().querySelector(".chooseCustomer").disabled = (type ==="customer");
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
			onRideAccepted: function(ride) {
				var rideInfo = ride._source;

				var marker = assocIdToOtherItemsMark[rideInfo.customer];
				if (!marker)
					marker = assocIdToOtherItemsMark[rideInfo.taxi];

				if (marker) {
					var popup = marker.getPopup();
					var loader = popup.getContent().querySelector(".loader");
					if(loader)
						loader.remove();
					marker.closePopup();
				}

				if (!rideControl)
					createRideControl();
				map.addControl(rideControl);
			},
			endRide: function(ride) {
				rideControl.removeFrom(map);
				rideControl = null;
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
