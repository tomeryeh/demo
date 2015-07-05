var
  KUZZLE_URL = 'api.uat.kuzzle.io:7512',
  CABBLE_COLLECTION_POSITIONS = 'coding-challenge-cabble-positions',
  CABBLE_COLLECTION_USERS = 'coding-challenge-cabble-users';

//IIFE, module partern,...

(function gisLoading() {

	var
    map,
    userMarker,
    userPosition,
    kuzzle,
    userId,
    whoami = { type: '' },
    customersRoom,
    taxisRoom,
    positionsRoom,
    refreshFilterTimer,
	  defaultCoord = new google.maps.LatLng(40.69847032728747, -73.9514422416687); //NewYork

	function initializeGis() {
		var mapOptions = {
			zoom: 16
		};
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

		if (navigator.geolocation) {
			browserSupportFlag = true;
			navigator.geolocation.getCurrentPosition(function(position) {
				userPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				map.setCenter(userPosition);

				userMarker = new google.maps.Marker({
					position: userPosition,
					title: 'You!',
					icon: "assets/img/phone.png"
				});
				userMarker.setMap(map);
        generateRandomCabs();

        /*
        Kuzzle interaction
         */
        connectToKuzzle();
        setInterval(function () {
          sendMyPosition()
        }, 3000);

        setUserType('customer');

			}, function() {
				map.setCenter(defaultCoord);
			});
		} else {
			map.setCenter(defaultCoord);
		}
	}

  function generateRandomCabs() {
    var arrayTaxiMarker = [];
    //You must recive an json with arrayTaxiMarker in it

    //this is what we must get from a first call to Kuzzle :

    //get random positions for taxi arrounf my position
    for (var i = 0; i < 10; i++) {
      arrayTaxiMarker.push(new google.maps.LatLng(userPosition.lat() + (Math.random() - 0.5) / 100, userPosition.lng() + (Math.random() - 0.5) / 100));
    }

    //2 add marker in map

    for (var i = 0; i < arrayTaxiMarker.length; i++) {
      var taxiMarker = new google.maps.Marker({
        position: arrayTaxiMarker[i],
        title: 'A taxi!',
        icon: "assets/img/imagen-taxi.jpg"
      });
      taxiMarker.setMap(map);
    }

    //3 each time kuzzle found a change, update map
    //see https://developers.google.com/maps/documentation/javascript/markers
  }

  /**
   * Cabble initialization:
   *  - Connect to Kuzzle
   *  - Get the User ID from Local Storage. If it doesn't exist, create one with Kuzzle
   *
   */
  function connectToKuzzle () {
    kuzzle = new Kuzzle(KUZZLE_URL);

    // TODO: retrieve userId from localstorage

    if (!userId) {
      userId = kuzzle.create(CABBLE_COLLECTION_USERS, whoami, true, function (response) {
        if (response.error) {
          console.error(response.error);
        }
        else {
          whoami._id = userId;
        }
      });
    }
  }

  /**
   * Tell Kuzzle what type of user I am (a cab or a customer)
   *
   * @param userType
   */
  function setUserType (userType) {
    var refreshInterval;

    whoami.type = userType;
    kuzzle.update(CABBLE_COLLECTION_USERS, whoami);

    if (userType === 'customer') {
      refreshInterval = 60000;

      if (customersRoom) {
        kuzzle.unsubscribe(customersRoom);
        customersRoom = null;
      }
    }
    else if (userType === 'taxi') {
      refreshInterval = 10000;

      if (taxisRoom) {
        kuzzle.unsubscribe(taxisRoom);
        taxisRoom = null;
      }
    }

    if (refreshFilterTimer) {
      clearInterval(refreshFilterTimer);
    }

    refreshFilterTimer = setInterval(function () {
        refreshKuzzleFilter()
      }, refreshInterval);
  }

  /**
   * Create myself in Kuzzle or update my position in it.
   *
   */
  function sendMyPosition () {
    var
      myPosition = {
        userId: whoami._id,
        type: whoami.type,
        position: userPosition
      };

      kuzzle.create(CABBLE_COLLECTION_POSITIONS, myPosition, false);
  }

  /**
   * - Gets the top-left and bottom-right corners coordinates from google maps
   * - Creates a kuzzle filter including geolocalization bounding box
   * - Unsubscribe from previous room if we were listening to one
   * - Subscribe to kuzzle with the new filter
   */
  function refreshKuzzleFilter() {
    var
      mapBounds = map.getBounds(),
      swCorner =mapBounds.getSouthWest(),
      neCorner = mapBounds.getNorthEast(),
      filterUserType = whoami.type === 'taxi' ? 'customer' : 'taxi',
      filter = {
        filter: {
          and: {
            term: {type: filterUserType},
            geoBoundingBox: {
              position: {
                top_left: {
                  lat: neCorner.lat(),
                  lon: swCorner.lng()
                },
                bottom_right: {
                  lat: swCorner.lat(),
                  lon: neCorner.lng()
                }
              }
            }
          }
        }
      };

    if (positionsRoom) {
      kuzzle.unsubscribe(positionsRoom);
    }

    console.dir(filter);
    positionsRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter, function (response) {
      if (response.error) {
        console.error(response.error);
      }

      // TODO: display or update the received user
    });
  }

	//waiting until googlempa is initialize as GIS service
	google.maps.event.addDomListener(window, 'load', initializeGis);

})();
