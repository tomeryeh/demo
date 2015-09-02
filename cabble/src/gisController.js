/**
 *	GIS module
 *	all the GIS specific code (here we use Leaflet) http://leafletjs.com/
 * 
 *
 **/

window.gisController = (function() {

	var map;
	var userMarker;
	var userPopup;
	var userPosition;

	var defaultUserPosition =[48.8566140, 2.352222];

	var userDraggable = false;

	var otherItemsMark = []; //depending on the nature of user this is a cab list or customer list
	var assocIdToOtherItemsMark = {};

	//max distance is 20000 kilometers
	var maxDistanceOfinterest = 200000000;

	var candidatesLayer = L.layerGroup([]);
	var currentRideLayer = L.layerGroup([]);

	var currentRideMarker = null; //the candidate choosen for the ride if any

	//static var about icon configuration
	var iconSize = [38, 38];
	var popupAnchor = [0, -22];

	var rideControl; //use to manage current ride accepted
	var geolocControl = null;

	var taxiIcon = L.icon({
		iconUrl: "assets/img/taxi.jpg",
		iconSize: iconSize,
		popupAnchor: popupAnchor
	});

	var taxiIconAnimated = L.icon({
		iconUrl: "assets/img/taxianimated.gif",
		iconSize: iconSize,
		popupAnchor: popupAnchor
	});

	var unknowIcon = L.icon({
		iconUrl: "assets/img/unknown.jpg",
		iconSize: iconSize,
		popupAnchor: popupAnchor
	});

	var customerIcon = L.icon({
		iconUrl: "assets/img/customer.png",
		iconSize: iconSize,
		popupAnchor: popupAnchor
	});

	var customerIconAnimated = L.icon({
		iconUrl: "assets/img/customeranimated.gif",
		iconSize: iconSize,
		popupAnchor: popupAnchor
	});

	function getIcon(type, animated) {
		var icon = unknowIcon;
		if (type === "taxi") {
			icon = taxiIcon;
			if (animated)
				icon = taxiIconAnimated;

		}
		if (type === "customer") {
			icon = customerIcon;
			if (animated)
				icon = customerIconAnimated;
		}
		return icon;
	}

	function hideControl(contr){
		if (contr)
			contr.getContainer().style.display = "none";
	}

	function showControl(contr){
		if (contr)
			contr.getContainer().style.display = "inline";
	}

	/**
	 * createUserMarker will create a marker on the map
	 *
	 * @param position LatLng type from http://leafletjs.com/
	 */
	function createUserMarker(position) {
		return new Promise(
			function(resolve, reject) {
				var userType = userController.getUserType();
				userPopup = createUserPopup();
				if(userMarker)
					map.removeLayer(userMarker);
				userMarker = L.marker(position, {
					draggable:userDraggable
				}
				).bindPopup(userPopup);

				userMarker.on("dragend",function(){
					defaultUserPosition = [userMarker.getLatLng().lat,userMarker.getLatLng().lng];
				});

				userMarker.setIcon(getIcon(userType));
				resolve(position);
			}.bind(this)
		);
	}

	/**
	 * createMap
	 *
	 * @param position LatLng type from http://leafletjs.com/
	 */
	function createMap(position) {
		return new Promise(
			function(resolve, reject) {

				var tileURL = 'http://a.basemaps.cartocdn.com/light_all//{z}/{x}/{y}.png';

				map = L.map('map-canvas', {
					layers: [candidatesLayer],
					zoomControl:false
				});

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

				if (!position) {
					map.fitWorld();
				} else {
					map.setView([position[0], position[1]], 15);
				}

				userMarker.addTo(map);

				createRideControl();
				map.addControl(rideControl);
				hideControl(rideControl);
				createGeolocControl();
				map.addControl(geolocControl);

				resolve(position);
			}).bind(this);
	}


	function createGeolocControl() {

		var pinUserPosition		= "Define the user position by drag";
		var unpinUserPosition	= "Use the manual geolocalisation";
		L.Control.GeoControl = L.Control.extend({
			options: {
				position: 'topright',
			},
			onAdd: function(map) {
				var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
				L.DomEvent
					.addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
					.addListener(controlDiv, 'click', L.DomEvent.preventDefault)
					.addListener(controlDiv, 'click', function() {
						userDraggable = !userDraggable;
						createUserMarker(userMarker.getLatLng());
						controlUI.innerHTML = userDraggable ? pinUserPosition : unpinUserPosition;
						userMarker.addTo(map);
					});

				var text = unpinUserPosition;
				var controlUI = L.DomUtil.create('button', 'leaflet-draw-edit-remove', controlDiv);
				controlUI.setAttribute("class", "info_button");
				controlUI.innerHTML = text;
				controlUI.title = text;
				controlUI.href = '#';
				return controlDiv;
				}
		});
		geolocControl = new L.Control.GeoControl();
	}

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
						kuzzleController.finishRide();
					});

				var text = 'End the ride';
				var controlUI = L.DomUtil.create('button', 'leaflet-draw-edit-remove', controlDiv);
				controlUI.setAttribute("class", "info_button");
				controlUI.innerHTML = text;
				controlUI.title = text;

				var loader = document.createElement("img");
				loader.setAttribute("class", "loader");
				loader.src = "/assets/img/loading.gif";
				controlUI.appendChild(loader);
					controlUI.href = '#';
					return controlDiv;
				}
		});
		rideControl = new L.Control.RideControl();
	}

	function createUserPopup() {

		var userType = userController.getUserType();

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

		var header = document.createElement("div");
		header.setAttribute("class", "header");
		header.appendChild(document.createTextNode("Hello from Cabble ! what can i do for you ?"));

		contentPop.appendChild(header);

		var footer = document.createElement("div");
		footer.setAttribute("class", "footer");

		var btnCustomer = document.createElement("BUTTON");
		btnCustomer.setAttribute("class", "chooseCustomer ok_button");
		btnCustomer.appendChild(document.createTextNode(customerText));

		var btnTaxi = document.createElement("BUTTON");
		btnTaxi.setAttribute("class", "chooseTaxi cancel_button");
		btnTaxi.appendChild(document.createTextNode(taxiText));

		footer.appendChild(btnCustomer);
		footer.appendChild(btnTaxi);

		contentPop.appendChild(footer);

		btnCustomer.addEventListener("click", function(event) {
			userMarker.setIcon(customerIcon);
			kuzzleController.publishUserType("customer");
			btnCustomer.innerHTML = customerSearchText;
			btnTaxi.innerHTML = wanabeTaxiForCustomer;
			btnTaxi.disabled = false;
			btnCustomer.disabled = true;
			map.closePopup(popupChooseUserType);
		});

		btnTaxi.addEventListener("click", function() {
			userMarker.setIcon(taxiIcon);
			kuzzleController.publishUserType("taxi");
			btnCustomer.innerHTML = wanabeCustomerTextForTaxi;
			btnTaxi.innerHTML = taxiSearchText;
			btnTaxi.disabled = true;
			btnCustomer.disabled = false;
			map.closePopup(popupChooseUserType);
		});
		var popupChooseUserType = L.popup().setContent(contentPop);

		popupChooseUserType.options.minWidth = 500;
		return popupChooseUserType;
	}

	function answerToRidePopup(source, target, rideProposal) {

		var answerPopupRide = null;

		var userType = userController.getUserType();

		var titleText = 'You have a ride proposition from this taxi';
		var acceptMessage = "Yes, pick me up!";
		var cancelMessage = "No, thank you.";

		if (userType === "taxi") {
			titleText = 'You have a ride proposition from this customer';
			acceptMessage = 'Yes, I pick you up!';
			cancelMessage = 'No, sorry.';
		}

		var contentPopup = document.createElement("div");

		var header = document.createElement("div");
		header.setAttribute("class", "header");
		header.appendChild(document.createTextNode(titleText));

		var footer = document.createElement("div");
		footer.setAttribute("class", "footer");

		var acceptCabbleButton = document.createElement("button");
		acceptCabbleButton.appendChild(document.createTextNode(acceptMessage));
		acceptCabbleButton.setAttribute("class", "ok_button");
		acceptCabbleButton.addEventListener("click", function(event) {
			map.closePopup(answerPopupRide);
			kuzzleController.acceptRideProposal(rideProposal);
			acceptCabbleButton.disabled = true;
		});
		footer.appendChild(acceptCabbleButton);

		var cancelCabbleButton = document.createElement("button");
		cancelCabbleButton.setAttribute("class", "cancel_button");
		cancelCabbleButton.appendChild(document.createTextNode(cancelMessage));
		cancelCabbleButton.addEventListener("click", function(event) {
			map.closePopup(answerPopupRide);
			kuzzleController.declineRideProposal(rideProposal);
			acceptCabbleButton.disabled = false;
		});
		footer.appendChild(cancelCabbleButton);

		contentPopup.appendChild(header);
		contentPopup.appendChild(footer);

		answerPopupRide = L.popup().setContent(contentPopup);
		answerPopupRide.options.minWidth = 500;
		return answerPopupRide;
	}

	function proposeARidePopup(type, candidateId) {
		var popupProposeRide = null;

		var proposeCabbleButton = document.createElement("button");
		proposeCabbleButton.setAttribute("class", "ok_button");
		var loader;

		var footer = document.createElement("div");
		footer.setAttribute("class", "footer");

		proposeCabbleButton.appendChild(document.createTextNode("Ask for a ride"));
		proposeCabbleButton.addEventListener("click", function(event) {
			popupContent = popupProposeRide.getContent();
			loader = document.createElement("img");
			loader.setAttribute("class", "loader");
			loader.src = "/assets/img/loading.gif";
			proposeCabbleButton.appendChild(loader);
			proposeCabbleButton.disabled = true;
			kuzzleController.publishRideProposal(candidateId);
		});
		footer.appendChild(proposeCabbleButton);

		var cancelCabbleButton = document.createElement("button");
		cancelCabbleButton.setAttribute("class", "cancel_button");
		cancelCabbleButton.appendChild(document.createTextNode("Cancel"));
		cancelCabbleButton.addEventListener("click", function() {
			kuzzleController.declineRideProposal(kuzzleController.getRideProposalForCandidateId(candidateId));
			if (loader) {
				loader.remove();
			}
			proposeCabbleButton.disabled = false;

			map.closePopup(popupProposeRide);
		});

		footer.appendChild(cancelCabbleButton);

		var contentPopup = document.createElement("div");

		var header = document.createElement("div");
		header.setAttribute("class", "header");
		var contentHeader = "";
		if (type === "customer")
			contentHeader += 'Propose this customer a ride';
		else
			contentHeader += 'Ask this taxi for a ride';
		header.appendChild(document.createTextNode(contentHeader));

		contentPopup.appendChild(header);
		contentPopup.appendChild(footer);

		popupProposeRide = L.popup().setContent(contentPopup);
		popupProposeRide.options.minWidth = 500;
		return popupProposeRide;
	}

	return {
		/**
		 * add a Marker for a candidate (I.e a taxi if user is a customer and vice verca)
		 * @parma position LatLng type from Lealfet.js
		 * @type the type of the marker (taxi or customer)
		 * id the id associated to the candidate
		 */
		addMarker: function(position, type, id) {
			var contentString;
			var marker;

			//update marker
			if (assocIdToOtherItemsMark[id]) {
				marker = assocIdToOtherItemsMark[id];
				marker.setLatLng(L.latLng(position.lat, position.lon));
			}
			//create marker
			else {
				var popup = proposeARidePopup(type, id);
				marker = L.marker([position.lat, position.lon], {
						icon: getIcon(type)
					})
					.addTo(candidatesLayer)
					.bindPopup(popup);

				marker.on("click", function() {
					marker.openPopup();
				});

				assocIdToOtherItemsMark[id] = marker;
				otherItemsMark.push(marker);
				return marker;
			}
		},

		/**
		 *  Display the map centered on user, the layout include the farthest
		 *  candidates.
		 *
		 */
		centererToBoundingCandidates: function(){
			var distance  = 0;
			var farthestMark = null;
			for (var i = 0; i < otherItemsMark.length; i++) {
				var currentDistance = userMarker.getLatLng().distanceTo(otherItemsMark[i].getLatLng());
				if(currentDistance > distance){
					distance = currentDistance;
					farthestMark = otherItemsMark[i];
				}
			}

			if(farthestMark){
				var positions = [];
				var userCoord = userMarker.getLatLng();
				var farthestCoord = farthestMark.getLatLng();
				positions.push([farthestCoord.lat, farthestCoord.lng]);
				positions.push([userCoord.lat + -1 * (farthestCoord.lat - userCoord.lat),userCoord.lng + -1 * (farthestCoord.lng - userCoord.lng)]);
				map.fitBounds(positions, {padding: L.point(200, 200)});
			}
		},
		isTooFarAway: function(position){
			if(!position)
				return false;
			return userMarker.getLatLng().distanceTo(L.latLng(position[0], position[1])) > maxDistanceOfinterest;
		},
		getGeoLoc: function() {
			return new Promise(
				function(resolve, reject) {
					if(userDraggable)
						resolve([gisController.getUserPosition().lat,gisController.getUserPosition().lng]);
					if (navigator.geolocation) {
						browserSupportFlag = true;
						navigator.geolocation.getCurrentPosition(function(position) {
							//var chrome = window.navigator.userAgent.indexOf("Chrome") > 0;
							//resolve([position.coords.latitude + (chrome ? 0.05 : 0), position.coords.longitude]);
							resolve([position.coords.latitude, position.coords.longitude]);
						}, function() {
							resolve(defaultUserPosition);
						});
					}
				}
			);
		},
		removeCandidate: function(id) {
			var marker = assocIdToOtherItemsMark[id];
			if (!marker)
				return;

			candidatesLayer.removeLayer(marker);
			currentRideLayer.removeLayer(marker);

			var indiceMarker = otherItemsMark.indexOf(marker);
			if (indiceMarker >= 0) {
				otherItemsMark.splice(indiceMarker, 1);
			}
			delete assocIdToOtherItemsMark[id];
		},
		setUserPosition: function(position) {
			return new Promise(
				function(resolve, reject) {
					if(position)
						userMarker.setLatLng(L.latLng(position[0], position[1]));
					resolve();
				});
		},
		getUserPosition: function() {
			return userMarker.getLatLng();
		},
		onUserChangeType: function() {
			var type = userController.getUserType();
			userMarker.setIcon(getIcon(type));
			userPopup.getContent().querySelector(".chooseTaxi").disabled = (type === "taxi");
			userPopup.getContent().querySelector(".chooseCustomer").disabled = (type === "customer");

			for (var i = 0; i < otherItemsMark.length; i++) {
				candidatesLayer.removeLayer(otherItemsMark[i]);
			}
			assocIdToOtherItemsMark = {};

			hideControl(rideControl);

			map.removeLayer(currentRideLayer);
			map.addLayer(candidatesLayer);

			currentRideMarker = null;
		},
		getMapBounds: function() {
			var mapBounds = map.getBounds();
			return {
				swCorner: mapBounds.getSouthWest(),
				neCorner: mapBounds.getNorthEast()
			};
		},
		init: function() {
			return this.getGeoLoc().
			then(createUserMarker).
			then(createMap).
			then(function() {
				setInterval(function() {
					gisController.centererToBoundingCandidates();
				}, 3000);
				
				if (!userController.getUserType())
					userMarker.openPopup();
			});
		},
		closePopupForUser: function() {
			userMarker.closePopup();
		},
		onRideRefused: function(candidateId) {
			var marker = assocIdToOtherItemsMark[candidateId];
			if (!marker)
				return;

			var popup = marker.getPopup();

			marker.setIcon(userController.getCandidateType() == "taxi" ? taxiIcon : customerIcon);

			var contentRefusedPopup = document.createElement("div");
			var titleText = "the ride has been refused !";


			//////////well beter use the recreate strat

			var header = document.createElement("div");
			header.appendChild(document.createTextNode(titleText));
			contentRefusedPopup.appendChild(header);

			var previousContent = popup.getContent();

			var loader = previousContent.querySelector(".loader");
			if (loader)
				loader.remove();

			var okButton = previousContent.querySelector(".ok_button");
			okButton.disabled = false;

			var cancelButton = previousContent.querySelector(".cancel_button");
			cancelButton.disabled = false;

			popup.setContent(contentRefusedPopup);

			setTimeout(function() {
				marker.closePopup();
				var popup = proposeARidePopup(userController.getCandidateType(), candidateId);
				marker.bindPopup(popup);
			}, 3000);
		},
		onRideAccepted: function(candidateId) {
			var marker = assocIdToOtherItemsMark[candidateId];
			
			if (!marker)
				return;

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

			marker.setIcon(userController.getCandidateType() == "taxi" ? taxiIcon : customerIcon);
			currentRideMarker = marker;
			//toggle layer to ride one (hide all other candidates for ride)
			map.removeLayer(candidatesLayer);
			map.addLayer(currentRideLayer);

			showControl(rideControl);
		},
		onRideEnded: function(candidateId) {
			hideControl(rideControl);
			if(currentRideMarker){
				currentRideLayer.removeLayer(currentRideMarker);
				currentRideMarker.addTo(candidatesLayer);
				var popup = proposeARidePopup(userController.getCandidateType(), candidateId);
				currentRideMarker.bindPopup(popup);			
			}
			map.removeLayer(currentRideLayer);
			map.addLayer(candidatesLayer);
		},
		onRideProposal: function(sourceId, targetId, rideProposal) {

			var markerSource = assocIdToOtherItemsMark[sourceId];
			var userType = userController.getUserType();

			//the source from ride is not know from GIS (not visible in current 
			//map or his position are not alread sended
			if (!markerSource) {

				var markerType = userController.getCandidateType();
				var markerPosition = {
					lat: rideProposal._source.position.lat,
					lon: rideProposal._source.position.lng
				};

				markerSource = this.addMarker(markerPosition, markerType, sourceId);

				this.centererToBoundingCandidates();
			}
			markerSource.setIcon(userController.getCandidateType() == "taxi" ? taxiIconAnimated : customerIconAnimated);

			var popupProposeRide = answerToRidePopup(sourceId, targetId, rideProposal);
			markerSource
				.bindPopup(popupProposeRide);
		}
	};

})();
