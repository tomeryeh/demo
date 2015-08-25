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

		function createProposeRidePopup(type) {

			var proposeCabble = document.createElement("p");
			var proposeCabbleButton = document.createElement("button");
			proposeCabbleButton.appendChild(document.createTextNode("Ask for a ride"));
			proposeCabble.appendChild(proposeCabbleButton);
			proposeCabble.addEventListener("click", function(event) {
				//we are not already sending a request to this taxi/customer
				//if (!contentInfoNode.querySelector(".propose_cabble .loader")) {
				//	var loaderText = '(request send, waiting for response...<img class="loader" src="assets/img/loading.gif"></img>)';
				//	propose_cabble.innerHTML = propose_cabble.innerHTML + loaderText;
				app.kuzzleController.sendRideProposal(id);
				//}
			});

			var cancelCabble = document.createElement("p");
			var cancelCabbleButton = document.createElement("button");
			cancelCabbleButton.appendChild(document.createTextNode("Cancel"));
			cancelCabble.appendChild(cancelCabbleButton);
			cancelCabble.addEventListener("click", function() {
				otherMarker.closePopup();
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

			return L.popup().setContent(contentPopup);

			//contentString += '<div id="bodyContent"><p><b>time estimated to meet you : 5 min !</b></p>';

		};

		function getGeoLoc() {
			return new Promise(
				function(resolve, reject) {
					if (navigator.geolocation) {
						browserSupportFlag = true;
						navigator.geolocation.getCurrentPosition(function(position) {
							resolve([position.coords.latitude, position.coords.longitude]);
						}, function() {
							reject();
						});
					}
				}
			);
		};

		//////////////////public methodes (i.e exposed) ///////////////////////
		return {

			createUserMark: function(position) {

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
							.bindPopup(popup)
							.openPopup();

						userMarker.setIcon(this.getIcon(userType));
						resolve();
					}.bind(this)
				);
			},

			resetAllMarks: function() {
				return new Promise(
					function(resolve, reject) {
						var resolver = Promise.pending();
						otherItemsMark.forEach(
							function(marker) {
								marker.setMap(null);
							}
						);

						assocIdToOtherItemsMark = {};
						resolve();
					}.bind(this));
			},

			addMarker: function(position, type, id) {
				var contentString;
				var marker;

				//update  position
				if (assocIdToOtherItemsMark[id]) {
					marker = assocIdToOtherItemsMark[id];
					marker.setLatLng(L.latLng(position.lat, position.lon));
					infowindow = marker.infowindow;
				}
				//creation
				else {
					var popup = createProposeRidePopup(type);
					marker = L.marker([position.lat, position.lon], {}).addTo(map)
						.bindPopup(popup)
						.openPopup();

					marker.setIcon(this.getIcon(type));

					assocIdToOtherItemsMark[id] = marker;

				}
			},

			getUserPosition: function() {
				return userMarker.getLatLng();
			},

			setUserType: function(type) {
				userMarker.setIcon(this.getIcon(type));
			},

			getIcon: function(type) {
				var icon = unknowIcon;
				if (type === "taxi") {
					icon = taxiIcon;
				}
				if (type === "customer") {
					icon = userIcon;
				}
				return icon;
			},

			getMapBounds: function() {
				var mapBounds = map.getBounds();
				return {
					swCorner: mapBounds.getSouthWest(),
					neCorner: mapBounds.getNorthEast()
				};
			},

			createMap: function(position) {
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
			},
			init: function() {
				return getGeoLoc().
				then(this.createMap).
				then(this.createUserMark.bind(this));
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

				markerSource.bindPopup(contentInfoNode)
					.openPopup();

				return new Promise(
					function(resolve, reject) {

						map.on("popupopen", function(eventPopup) {
							//console.log("popup open from ride proposal ");
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
