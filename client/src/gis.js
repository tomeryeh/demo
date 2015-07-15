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

		var defaultCoord = new google.maps.LatLng(40.69847032728747, -73.9514422416687); //NewYork
		var otherItemsMark = []; //depending on the nature of user this is a cab list or customerlist

		var currentWindowClose = null;

		var assocIdToOtherItemsMark = {};

		var bias; //a bias from long and lat to simulated differnt positions.

		function getIcon(userType) {
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
					'<h1 id="firstHeading" class="firstHeading">I am available ! </h1>' +
					'<div id="bodyContent"><p><b>time estimated to meet you : 5 min !</b></p>' +
					'<p><a href="tel:[phone number]"><span class="bottom">Call us now</span></a></p>' +
					'</div></div>';

			} else {
				contentString = '<div id="content_info_item"><div id="siteNotice"></div>' +
					'<h1 id="firstHeading" class="firstHeading">I need a ride ! </h1>' +
					'<p><a href="tel:[phone number]"><span class="bottom">Yes, i pick you up !</span></a></p>' +
					'<p><a href="tel:[phone number]"><span class="bottom">No, Sorry.</span></a></p>' +
					'</div></div>';
			}

			var infowindow = new google.maps.InfoWindow({
				content: contentString
			});
			google.maps.event.addListener(infowindow, 'domready', function() {
				document.querySelector("#content_info_item").parentNode.parentNode.parentNode.parentNode.style.opacity = 0.8;
			});

			if (nearestItem) {

				if (currentWindowClose)
					currentWindowClose();
				infowindow.open(map, nearestItem);

				currentWindowClose = function() {
					infowindow.close(map, nearestItem);
				}
			}
		}

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

			if (app.simulate) {

				if (!bias)
					bias = [(Math.random() - 0.5) / 100, (Math.random() - 0.5) / 100];
				else
					bias = [bias[0] - (Math.random() - 0.5) / 1000, bias[1] - (Math.random() - 0.5) / 1000];
			} else {
				bias = [0, 0];
			}

			return new Promise(
				function(resolve, reject) {
					var userType = app.userController.getUser() && app.userController.getUser().whoami.type;
					userPosition = new google.maps.LatLng(position.coords.latitude - bias[0], position.coords.longitude - bias[1]);
					map.setCenter(userPosition);

					userMarker = new google.maps.Marker({
						position: userPosition,
						title: 'You!',
						icon: getIcon(userType)
					});

					var contentString = "";

					var taxiSearchText = "looking for a customer...";
					var customerSearchText = "looking for a taxi...";

					var wanabeCustomerTextForTaxi = "No ! I need a ride";
					var wanabeTaxiForCustomer = "No ! i'm looking for a customer";

					var leftText;
					var rightText;

					if (userType) {
						if (userType === "taxi") {
							leftText = wanabeCustomerTextForTaxi;
							rightText = taxiSearchText;
						}

						if (userType === "customer") {
							leftText = customerSearchText;
							rightText = wanabeTaxiForCustomer;
						}
					} else {
						leftText = "i need a ride";
						rightText = "i'm looking of ra customer";
					}

					userMarker.setMap(map);

					var contentString = "Hello from Cabble ! what can i do for you ?";
					contentString += '<div class="btn-group btn-group-justified" role="group" aria-label="...">';
					contentString = '<div class="btn-group" role="group">';
					contentString = '<button id="left_cabble" type="button" class="btn btn-default">' + leftText + '</button>';
					contentString += '</div>';

					contentString += '<div class="btn-group" role="group">'
					contentString += '<button id="right_cabble"  type="button" class="btn btn-default">' + rightText + '</button>';
					contentString += '</div>'
					contentString += '</div>';

					var infowindow = new google.maps.InfoWindow({
						content: contentString
					});

					google.maps.event.addListener(infowindow, 'domready', function() {

						///kick and dirty ui logic !
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

						left_cabble.addEventListener("click", function(event) {
							userMarker.setIcon(getIcon("customer"));
							app.kuzzleController.setUserType("customer");
							left_cabble.innerHTML = customerSearchText;
							right_cabble.innerHTML = wanabeTaxiForCustomer;
							right_cabble.disabled = false;
							left_cabble.disabled = true;

							resolve();
						});

						right_cabble.addEventListener("click", function() {
							userMarker.setIcon(getIcon("taxi"));
							app.kuzzleController.setUserType("taxi");
							left_cabble.innerHTML = wanabeCustomerTextForTaxi
							right_cabble.innerHTML = taxiSearchText;
							right_cabble.disabled = true;
							left_cabble.disabled = false;

							resolve();
						});

					});

					// 3 seconds after the center of the map has changed, pan back to the
					// marker.
					google.maps.event.addListener(map, 'center_changed', function() {
						window.setTimeout(function() {
							map.panTo(userMarker.getPosition());
						}, 3000);
					});

					var visible = !userType;

					google.maps.event.addListener(userMarker, 'click', function() {
						if (visible) {
							if (currentWindowClose)
								currentWindowClose();
							//infowindow.close(map, userMarker);
							//currentWindowOpen = null;
						} else {
							if (currentWindowClose)
								currentWindowClose();
							infowindow.open(map, userMarker);

							currentWindowClose = function() {
								infowindow.close(map, userMarker)
							};
						}
						visible = !visible;
					});

					if (!userType) {
						if (currentWindowClose)
							currentWindowClose();
						infowindow.open(map, userMarker);

						currentWindowClose = function() {
							infowindow.close(map, userMarker)
						};
					} else {
						//console.log("we have a type " + userType);
						app.kuzzleController.setUserType(userType);
						resolve();
					}
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
								//google.maps.event.removeListeners(marker.infowindow);
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
					}
					//infowindow.close(map, otherMarker);
					else {
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
				return userPosition;
			},
			getMapBounds: function() {
				var mapBounds = map.getBounds();
				return {
					swCorner: mapBounds.getSouthWest(),
					neCorner: mapBounds.getNorthEast()
				};
			},
			moveSlowly: function() {
				var userType = app.userController.getUser() && app.userController.getUser().whoami.type;
				if (userType !== "taxi")
					return;
				userPosition = new google.maps.LatLng(userMarker.position.lat() - -(Math.random() - 0.5) / 1000, userMarker.position.lng() - -(Math.random() - 0.5) / 1000);
				userMarker.position = userPosition;

				userMarker.setMap(null);
				userMarker.setMap(map);
			},

			init: function() {

				console.log("gis controller creation...");
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
							console.log("...gis controller ended");
							resolve();
						})
					})
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
