/**
 *	GIS module
 *	all the GIS specific code (here we use Leaflet) http://leafletjs.com/
 *
 **/

window.gis = (function() {

	var map;
	var userMarker;
	var userPopup;
	var userPosition;

	var rideControl; //use to manage current ride accepted

	var otherItemsMark = []; //depending on the nature of user this is a cab list or customerlist
	var assocIdToOtherItemsMark = {};

	var candidatesLayer = L.layerGroup([]);
	var currentRideLayer = L.layerGroup([]);
	var currentRideMarker = null; //the candidate choosen for the ride

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

	var animateMarker = function(marker) {
		var t = 0;
		var marker = marker;
		var timer;

		return {
			start: function() {
				timer = window.setInterval(function() {
					//console.log(marker.getLatLng());
					var delta = t % 100;
					delta -= 50;
					delta *= 0.00001;
					marker.setLatLng(L.latLng(marker.getLatLng().lat + delta, marker.getLatLng().lng));
					t += 1;
				}, 50);
			},
			stop: function() {
				if (timer)
					clearInterval(timer);
			}
		}
	};

	function createUserMarker(position) {

		return new Promise(
			function(resolve, reject) {
				var coordinates = [position[0], position[1]];
				map.setView(coordinates, 15);

				var userType = app.userController.getUser() && app.userController.getUser().whoami.type;

				userPopup = createUserPopup(userType);

				userMarker = L.marker(coordinates, {})
					.addTo(map)
					//	.addTo(candidatesLayer)
					//	.addTo(currentRideLayer)
					.bindPopup(userPopup);

				if (!userType)
					userMarker.openPopup();

				userMarker.setIcon(getIcon(userType));

				//window.setInterval(function() {
				//	map.panTo(userMarker.getLatLng());
				//}, 3000);

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

				//setInterval(function() {
				//	map.panTo(L.latLng(position));
				//}, 3000);

				var tileURL = 'http://a.basemaps.cartocdn.com/light_all//{z}/{x}/{y}.png';
				//'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ'

				candidatesLayer = L.layerGroup([]);
				currentRideLayer = L.layerGroup([]);

				map = L.map('map-canvas', {
					layers: [candidatesLayer]
				}).setView(position, 13);

				L.tileLayer(tileURL, {
					maxZoom: 18,
					attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
						'<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
						'Imagery © <a href="http://mapbox.com">Mapbox</a>',
					id: 'mapbox.streets'
				}).addTo(map);

				var baseMaps = {};
				var overlayMaps = {
					"candidates": candidatesLayer,
					"currentRide": currentRideLayer
				};
				L.control.layers(baseMaps, overlayMaps).addTo(map);

				resolve(position);
			}).bind(this);
	};

	function createRideControl() {
		L.Control.RideControl = L.Control.extend({
			options: {
				position: 'bottomright',
			},
			onAdd: function(map) {
				var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
				L.DomEvent
					.addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
					.addListener(controlDiv, 'click', L.DomEvent.preventDefault)
					.addListener(controlDiv, 'click', function() {
						app.kuzzleController.finishRide();
					});

				var text = 'End the ride';
				var controlUI = L.DomUtil.create('button', 'leaflet-draw-edit-remove', controlDiv);
				controlUI.setAttribute("class", "info_button");
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

		var contentPop = document.createElement("h1");
		contentPop.appendChild(document.createTextNode("Hello from Cabble ! what can i do for you ?"));

		var btnCustomer = document.createElement("BUTTON");
		btnCustomer.setAttribute("class", "chooseCustomer ok_button")
		btnCustomer.appendChild(document.createTextNode(customerText));

		var btnTaxi = document.createElement("BUTTON");
		btnTaxi.setAttribute("class", "chooseTaxi cancel_button")
		btnTaxi.appendChild(document.createTextNode(taxiText));

		contentPop.appendChild(btnCustomer); // Append the text to <button>
		contentPop.appendChild(btnTaxi); // Append the text to <button>

		btnCustomer.addEventListener("click", function(event) {
			userMarker.setIcon(userIcon);
			app.kuzzleController.setUserType("customer");
			app.gisController.setUserType("customer");
			btnCustomer.innerHTML = customerSearchText;
			btnTaxi.innerHTML = wanabeTaxiForCustomer;
			btnTaxi.disabled = false;
			btnCustomer.disabled = true;
			map.closePopup(popupChooseUserType);
		});

		btnTaxi.addEventListener("click", function() {
			userMarker.setIcon(taxiIcon);
			app.kuzzleController.setUserType("taxi");
			app.gisController.setUserType("taxi");
			btnCustomer.innerHTML = wanabeCustomerTextForTaxi
			btnTaxi.innerHTML = taxiSearchText;
			btnTaxi.disabled = true;
			btnCustomer.disabled = false;
			map.closePopup(popupChooseUserType);
		});
		var popupChooseUserType = L.popup().setContent(contentPop);
		return popupChooseUserType;
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
		acceptCabbleButton.setAttribute("class", "ok_button");
		acceptCabbleButton.addEventListener("click", function(event) {
			map.closePopup(popupProposeRide);
			app.kuzzleController.acceptRideProposal(rideProposal);
			acceptCabbleButton.disabled = true;
		});

		var cancelCabble = document.createElement("p");
		var cancelCabbleButton = document.createElement("button");
		cancelCabbleButton.setAttribute("class", "cancel_button");
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
		proposeCabbleButton.setAttribute("class", "ok_button");
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
		cancelCabbleButton.setAttribute("class", "cancel_button");
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
						resolve([position.coords.latitude + (chrome ? 0.05 : 0), position.coords.longitude]);
						//resolve([position.coords.latitude, position.coords.longitude]);
					}, function() {
						//TODO ask for user to give it a position
						reject();
					});
				}
			}
		);
	};
	return {

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
				marker = L.marker([position.lat, position.lon], {
						icon: getIcon(type)
					})
					.addTo(candidatesLayer)
					.bindPopup(popup);

				marker.on("click", function() {
					marker.openPopup();
				});

				//we must choose between adding popup and thumble element.
				//adding popup
				//marker.openPopup();

				//thumble element.
				var iconForMarker = getIcon(type);
				//iconForMarker.options.className = "animated bounce";
				marker.setIcon(iconForMarker);

				assocIdToOtherItemsMark[id] = marker;
				otherItemsMark.push(marker);
				return marker;
			}
		},

		getUserPosition: function() {
			return userMarker.getLatLng();
		},
		setUserType: function(type) {
			//console.log("set user type " + type);
			userMarker.setIcon(getIcon(type));
			userPopup.getContent().querySelector(".chooseTaxi").disabled = (type === "taxi");
			userPopup.getContent().querySelector(".chooseCustomer").disabled = (type === "customer");

			for (var i =0; i <otherItemsMark.length;i++){
				candidatesLayer.removeLayer(otherItemsMark[i]);
			}
			assocIdToOtherItemsMark = {};

			if(rideControl)
				rideControl.removeFrom(map);

			map.removeLayer(currentRideLayer);
			map.addLayer(candidatesLayer);

			currentRideMarker = null;
			rideControl = null;
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

		onRideRefused: function(ride) {
			var rideInfo = ride._source;

			var marker = assocIdToOtherItemsMark[rideInfo.customer];
			if (!marker)
				marker = assocIdToOtherItemsMark[rideInfo.taxi];

			if (marker) {
				var popup = marker.getPopup();

				var contentPopup = document.createElement("div");
				var titleText = "the ride has been refused !";

				var header = document.createElement("h1");
				header.appendChild(document.createTextNode(titleText));
				contentPopup.appendChild(header);

				popup.setContent(contentPopup);
				setTimeout(function(){
					marker.closePopup();
				},3000);
				
			}
		},
		onRideAccepted: function(ride) {
			var rideInfo = ride._source;

			var marker = assocIdToOtherItemsMark[rideInfo.customer];
			if (!marker)
				marker = assocIdToOtherItemsMark[rideInfo.taxi];

			if (marker) {
				var popup = marker.getPopup();
				var loader = popup.getContent().querySelector(".loader");
				if (loader)
					loader.remove();

				var okButton = popup.getContent().querySelector(".ok_button");
				okButton.disabled = false;

				var cancelButton = popup.getContent().querySelector(".cancel_button");
				cancelButton.disabled = false;

				marker.closePopup();

				candidatesLayer.removeLayer(marker);
				marker.addTo(currentRideLayer);
				currentRideMarker = marker;
				//toggle layer to ride one (hide all other candidates for ride)
				map.removeLayer(candidatesLayer);
				map.addLayer(currentRideLayer);
			}

			if (!rideControl)
				createRideControl();
			map.addControl(rideControl);
		},
		onRideEnded: function(ride) {
			if(rideControl)
				rideControl.removeFrom(map);

			currentRideLayer.removeLayer(currentRideMarker);
			currentRideMarker.addTo(candidatesLayer);
			map.removeLayer(currentRideLayer);
			map.addLayer(candidatesLayer);

			///Get popup from marker
			var popup = currentRideMarker.getPopup();
			//rearm ok button for popup.
			var okButton = popup.getContent().querySelector(".ok_button");
			okButton.disabled = false;

			currentRideMarker = null;
			rideControl = null;
		},
		showPopupRideProposal: function(source, target, rideProposal) {

			var markerSource = assocIdToOtherItemsMark[source];

			//the source from ride is not know from GIS (not visible in current map or his position are not alread sended
			if (!markerSource) {
				var userType = app.userController.getUser() && app.userController.getUser().whoami.type;
				var markerType = "customer";
				var markerId = rideProposal._source.taxi;
				var markerPosition = {
					lat: rideProposal._source.position.lat,
					lon: rideProposal._source.position.lng
				};
				if (userType == "customer") {
					markerType = "taxi";
					markerId = rideProposal._source.customer;
				}

				markerSource = this.addMarker(markerPosition, markerType, markerId);

				var positions = [];
				for (var i = 0; i < otherItemsMark.length; i++) {
					positions.push([otherItemsMark[i].getLatLng().lat, otherItemsMark[i].getLatLng().lng]);
				}
				positions.push([userMarker.getLatLng().lat, userMarker.getLatLng().lng])
				map.fitBounds(positions, {
					padding: L.point(200, 200)
				});

			}
			var popupProposeRide = createPopupRideProposal(source, target, rideProposal);
			markerSource
				.bindPopup(popupProposeRide)
				.openPopup();
		}
	};

})();
