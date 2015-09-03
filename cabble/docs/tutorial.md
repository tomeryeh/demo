# Kuzzle - Cabble tutorial

The highlight between Cabble and other demos is the geolocalisation filtering.
It will be explicited in [subscribe to positions changing](#sub_to_pos).


# The three controllers.

The entry point for Cabble is [app.js](../src/app.js).
This file can be resume to the following snippet with Promise :

```javascript
	gisController.init()
		.then(userController.init)
		.then(kuzzleController.init);
```

Corresponding to  :

  * [`gisController`](../src/gisController.js) (gis is for Geolocalisation Information System) is devoted to map rendering and manipulating markers.
Cabble use the awesome [Leafletjs](http://leafletjs.com/) for rendering. After the `gisController.init` call, the user is geolocalised, and visible on the center of the newly rendered map.
  * [`userController`](../src/userController.js) allow to deal with localstorage as a persistance user information data.
  After the `userController.init`, the previous user saved into localstorage is loaded.
  * [`kuzzleController`](../src/kuzzleController.js) is devoted to all the PubSub (Publication-Subscription) with Kuzzle.
  After the `kuzzleController.init`, pubsub with Kuzzle for positions, user status, and rides are avaialable.


We will focus on [`kuzzleController`](../src/kuzzleController.js). When some call will be done to gisController or userController we will explain brievely their meaning if ir is not self explanatory.

# The three collections in kuzzleController

Cabble deal with three collections : `CABBLE_COLLECTION_POSITIONS`, `CABBLE_COLLECTION_USERS` and `CABBLE_COLLECTION_RIDES`.

* `CABBLE_COLLECTION_POSITIONS` will be used for the geolocalisation.
* `CABBLE_COLLECTION_USERS` will be used to send the change in user status (an user can choose to be a taxi first and then become a customer). In order to leave user focus on his goal, Cabble does not show Taxi if the user is a taxi and vice versa.
* `CABBLE_COLLECTION_RIDES` will be used to send and update the ride status into Cabble.


The init for kuzzleController is : 
```javascript
	return {
		init: function() {
			return new Promise(
				function(resolve, reject) {
					var user = userController.getUser();
					//this is the first time user is connected to Kuzzle,
					//Cabble ask an id user to Kuzzle
					if (!user.userId) {
						//createUser set the new id send from Kuzzle to user.
						kuzzleController.createUser(user, function() {
							kuzzleController.initPubSub();
							resolve();
						});
					} else {
						//user has been found in localstorage from userController
						kuzzleController.initPubSub();
						resolve();
					}
			});
	}
```

Cabble ask for Kuzzle for an id if no user is already found in localstorage (see fetchFromLocalStorage in userController for details). Then Cabble init the publication subscriptions via initPubSub for the three collections :


```javascript
	initPubSub: function() {

		//positions collection
		kuzzleController.publishPositions();
		kuzzleController.subscribeToPositions();

		//users collection
		kuzzleController.subscribeToUsers();

		//rides collection
		kuzzleController.subscribeToRides();
	},
```
The three following sections will describe : 

 * the positions pub-sub,
 * the user pub-sub,
 * the ride pub-sub.



## Positions management
Cabble publish as a non persitant document the current user position into Positions collection (see publish a position udpate).

Cabble use the geolocalisation filtering from Kuzzle to be aware of candidates in the user map bounding box (subscribeToPositions) to listening to candidates near the current user position (see Subscribe to position updates).



### Publish a position udpate

Cabble has to send the positions changes for user in order to synchronize all positions in all other Cabble instance.
For real time purpose we can use the [watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) from webapi with Leaflet.js, but to keep it simple Cabble will send position every 3000 milliseconds : 


<a name="pub_room_name" ></a>
```javascript
	publishPositions: function() {
		setInterval(
			function() {
				gisController.getGeoLoc().
				then(gisController.setUserPosition).
				then(function() {
					var userPosition = gisController.getUserPosition();
					var userId = userController.getUserId();
					var userType = userController.getUserType();

					if (!userPosition) {
						console.log("no position for user");
						return;
					}
					if (!userType)
						return;

					//Cabble send a non perisistant document : our current position
					kuzzle.create(CABBLE_COLLECTION_POSITIONS, {
						type: userType,
						position: {
							lat: userPosition.lat,
							lon: userPosition.lng
						},
						userId: userId,
						userSubRoomName: userSubRoomName
					}, false);
				});
			}, 3000);
	}
```
Cabble send informations about user id and type ("taxi" or "customer") , current geolocalisation and send 
it as a document with `kuzzle.create`. This document will be not persisted in Kuzzle (i.e last argument of `kuzzle.create` is `false`).

<a name="sub_to_pos" ></a>
###  Subscribe To Position updates

Cabble propose to the user some "candidates" for a ride in the curent map bounding box.
A candidate is a taxi if the current user is a customer and vice versa.


The subscribe filter for bounding box with the current use type is computed as follow in `subscribeToPositions` :

```javascript
	var
		bound = gisController.getMapBounds(),
		user = userController.getUser(),
		filterUserType = userController.getCandidateType(),
		filter = {
			and: [{
			term: {
				type: filterUserType
				}
			}, {
				geoBoundingBox: {
				position: {
					top_left: {
						lat: bound.neCorner.lat,
						lon: bound.swCorner.lng
					},
					bottom_right: {
						lat: bound.swCorner.lat,
						lon: bound.neCorner.lng
						}
					}
				}
			}]
		};
```

There are plenty of cases where we have to change the bounding box of interest :

 * zoom or pan into the map,
 * change the viewport size (by changing browser size, by changing the phone orientation, ...)
 * change from state taxi to customer (if user is a customer, he is interesting for taxi and vice versa, marker on map must reflect that).

To keep it simple, we will NOT listen to all these events but instead blindly force the filtering to be change every 10000 milliseconds  :

```javascript
	// we remove deprecated timer if any first
	if (refreshFilterTimerSubPosition)
		clearInterval(refreshFilterTimerSubPosition);

	refreshFilterTimerSubPosition = setInterval(function() {
		//subscribe for candidates in bounding box for the current user type here.
		
		...
		//remove last deprecated subscribe :
		if (positionsSubscribeRoom) {
			kuzzle.unsubscribe(positionsSubscribeRoom);
		}
		//adding a new subscribe :
		positionsSubscribeRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter,
		....
	}, 10000);
```

When Cabble recive a position change for our current filter , we add the candidate or update his position on the map. 

<a name="update_room_name" ></a>
```javascript
	function(error, message) {
		if (error) {
			console.error(error);
			return;
		}

		if (message.action == "create") {
			assocRoomToUser[message._source.roomName] = message._source.userId;
			var candidatePosition = message._source.position;
			var candidateType = message._source.type;
			var candidateId = message._source.userId;

			if (candidateType === userController.getUserType())
				return;
			//adding the marker into the map.
			gisController.addMarker(candidatePosition, candidateType, candidateId);
		}
	});
```

That it ! for the geolocalisation filtering process, we are done !

The following section are about Cabble management for user change and ride porposal.

## Users management

The User management refer to listen to user changing type or disconnection (i.e unscribe to the collection).

### Publish an user change

Every time the user choose to change between taxi and customer type, Cabble must update the user in localstorage (`userController`) and the view (`gisController`). Then Cabble send this information to Kuzzle.

```javascript
	publishUserType: function(userType) {
		if (!userType)
		return;

		userController.setUserType(userType).then(function() {
			gisController.onUserChangeType();
			kuzzle.update(CABBLE_COLLECTION_USERS, userController.getUser().whoami,
				function(error, response) {
					if (error) {
						console.log(error);
						return;
					}
				});
			kuzzleController.subscribeToUsers();
			kuzzleController.subscribeToPositions();
		});
	}
```

Finally we re-add the `subscribeToUsers` and `subscribeToPositions` because we must 
change theirs filters accordingly to the new user type.

### <a name="user_subscription" ></a> Subscribe to users change

The subscribing to users change is done in `subscribeToUsers`.

```javascript
	subscribeToUsers: function() {
		var userStatus = {
			exists: {
				field: 'type'
			}
		};
		...

		kuzzle.subscribe(CABBLE_COLLECTION_USERS, 
						userStatus, function(error, message) {
			if (error) {
				console.error(error);
				return false;
			}

			if (!message || message.action != "off")
				return;

			//if this user was not on our map nothing to do
			var userId = assocRoomToUser[message.roomName];
			if (!userId)
				return;
			//else we remove it from the map
			gisController.removeCandidate(userId);
			...
		});
	}
```

The user subscribe is only intented to remove the disconnnected candidates, and the candidates having canging theirs types.
This is done by listening to the user collection with a filter `field: 'type'` only on action `off`.


`message` does not contain the `userId` , but the attribute `roomName` that identify uniquely the user.
Thanks to this `assocRoomToUser`, Cabble retrieve the `userId` and remove this candidate from the map with `gisController.removeCandidate(userId);`. 

### About `assocRoomToUser` updating
This object `assocRoomToUser` was updated into pub-sub Position process :

 * to publish association, `userSubRoomName` and `userId` are send with in the snippet [Sending assoc roomname user id](#pub_room_name) 
 * and are recive on Subscribe with the snippet [Keeping updated the association between roomName and userId](#update_room_name)
 


## Rides management

The rides management is closely related to the [overview sketching up](./overview.md) :

 * first a ride is <b>proposed</b> by a customer or a taxi, 
 * the ride can be <b>declined</b> by candidate or <b>accepted</b>,
 * finally the ride can be <b>completed</b> anytime by both taxi or customer.

The proposition of a ride correspond to a ride creation.
 <b>proposed</b>, <b>declined</b> and <b>completed</b> are the three states for a ride.

 * the subscription process `publishRideProposal` will delegate all the states changing managemenet in `manageRideProposal`.
 * the creation/proposition ride is done in method subsection "Propose a Ride".
 * we have three update process, each corresponding to a state changing.
 

### Subscribing to the Rides messages

```javascript
	subscribeToRides: function() {
		var
			filter = {
				and: []
			},
			rideFilter = {
				term: {}
			},
			user = userController.getUser(),
			userType = userController.getUserType(),
			statusFilter = {
				not: {
					terms: {
						status: [
							'proposed_by_' + userType,
							'refused_by_' + userType,
							'accepted_by_' + userType
						]
					}
				}
			};

		if (!userType)
			return;

		rideFilter.term[userType] = userController.getUserId();
		filter.and = [rideFilter, statusFilter];

		kuzzle.subscribe(CABBLE_COLLECTION_RIDES, filter, function(error, message) {
			if (error) {
				console.error(error);
				return false;
			}
			kuzzleController.manageRideProposal(message);
		});
	}
```

Nothing too complicated here, the `filter` ride is about  :

 * filtering on every users not of our type (i.e filter on taxi if i am a customer and vice versa ) (done by the snippet with status "proposed\_by\_..., refused\_by\_... and accepted\_by\_...) 
 * related to me (via the snippet  :
 	
		rideFilter.term[userType] = userController.getUserId();)


### Propose a Ride pub-sub

When the user click on a candidate icon, a popup appear and the user has the possibility to propose a ride.

A ride correspond to a document in the CABBLE_COLLECTION_RIDES.
This is done in the publishRideProposal method :

```javascript
	kuzzle.create(CABBLE_COLLECTION_RIDES, rideProposal, true, 
		function(error, response) {
		if (error) {
			console.error(error);
			return false;
		}
		currentRide = response.result;
	});	
```


The <b>Subcription</b> part answer in manageRideProposal.

If user is no availalable (i.e already involve in an other ride), the ride is silently declined.

```javascript
	if (rideInfo.status.indexOf('proposed_by') !== -1) {
		if (!userController.isAvailable()) {
			this.declineRideProposal(rideProposal);
			return;
		}
	}
```
Else we notify the candidate by the `onRideProposal` method (the candidate icon will blink)
```javascript
	else {
		var proposedByTaxi = rideInfo.status === "proposed_by_taxi";
		var candidateType = (proposedByTaxi) ? "taxi" : "customer";
		var userType = userController.getUserType();

		// a ride recive and current Cabble user has changing his type.
		if (userType === candidateType)
			return;
		var target = (proposedByTaxi) ? rideInfo.customer : rideInfo.taxi;
		var source = (proposedByTaxi) ? rideInfo.taxi : rideInfo.customer;
		gisController.onRideProposal(source, target, rideProposal);
	} 
```

### Accept a Ride proposal

The candidate has the ability from a popup to decline or accept the ride.
In case of acceptation, the action will be send to Kuzzle with `acceptRideProposal`.
In this function , we first publish the ride acceptance by updating the document corresponding to the ride.

```javascript
	acceptRideProposal: function(rideProposal) {
		var
			myUserType = userController.getUserType(),
			acceptedRide = {
				_id: rideProposal._id,
				status: 'accepted_by_' + myUserType
			};
			

		userController.setAvailable(false);
		kuzzle.update(CABBLE_COLLECTION_RIDES, acceptedRide);
		currentRide = rideProposal;
		gisController.onRideAccepted(currentRide);
```


The Subcription part answer in manageRideProposal is :
```javascript
	if (rideInfo.status.indexOf('refused_by') !== -1) {
		gisController.onRideRefused(rideProposal);
		currentRide = null;
	} else if (rideInfo.status.indexOf('accepted_by') !== -1) {
		currentRide = rideProposal;
		gisController.onRideAccepted(rideProposal);
	} else if (rideInfo.status.indexOf('completed') !== -1) {
		currentRide = null;
		gisController.onRideEnded(rideInfo);
	}
```


Then Cabble decline all the other rides proposal.

```javascript
		// All rides, except this one, proposed by others and involving me
		var listProposal = {
			filter: {
				and: [{
					term: {
						status: 'proposed_by_' + 
							(myUserType === 'taxi' ? 'customer' : 'taxi')
					}
				}, {
					not: {
						ids: {
							values: [rideProposal._id]
						}
					}
				}]
			}
		};

		userSubFilter.term[myUserType] = userController.getUserId();
		listProposal.filter.and.push(userSubFilter);

		var userSubFilter = {
			term: {}
		};

		/*
		At this point, we have 1 accepted ride proposal, and possibly multiple
		ride proposed in the meantime.
		So here we list these potential proposals and gracefully decline these
		 */
		kuzzle.search(CABBLE_COLLECTION_RIDES, listProposal,
			function(error, searchResult) {
			if (error) {
					console.log(error);
					return false;
				}

				searchResult.hits.hits.forEach(function(element) {
					// element is not a ride document, but it contains
					// the _id element we need to decline the ride
					kuzzleController.declineRideProposal(element);
				});
		});
```


### Decline a Ride

Decline a ride is simply update the document rideProposal in Kuzzle :

```javascript
	declineRideProposal: function(rideProposal) {
		var declinedRide = {
			_id: rideProposal._id,
			status: 'refused_by_' + userController.getUserType()
		};

		kuzzle.update(CABBLE_COLLECTION_RIDES, declinedRide);
	},
```


The Subcription part answer in manageRideProposal is :
```javascript
	if (rideInfo.status.indexOf('refused_by') !== -1) {
		gisController.onRideRefused(rideProposal);
		currentRide = null;
	} else if (rideInfo.status.indexOf('accepted_by') !== -1) {
		currentRide = rideProposal;
		gisController.onRideAccepted(rideProposal);
	} else if (rideInfo.status.indexOf('completed') !== -1) {
		currentRide = null;
		gisController.onRideEnded(rideInfo);
	}
```

### Finish a Ride

Finsih a ride is simply update the document rideProposal in Kuzzle and update the user state :

```javascript
	finishRide: function() {
		if (!currentRide) {
			console.log("no curent ride");
			return;
		}

		var finishedRide = {
			_id: currentRide._id,
			status: 'completed'
		};

		userController.setAvailable(true);
		kuzzle.update(CABBLE_COLLECTION_RIDES, finishedRide);
	}
```


The Subcription part answer in manageRideProposal is :
```javascript
	if (rideInfo.status.indexOf('refused_by') !== -1) {
		gisController.onRideRefused(rideProposal);
		currentRide = null;
	} else if (rideInfo.status.indexOf('accepted_by') !== -1) {
		currentRide = rideProposal;
		gisController.onRideAccepted(rideProposal);
	} else if (rideInfo.status.indexOf('completed') !== -1) {
		currentRide = null;
		gisController.onRideEnded(rideInfo);
	}
```