# Kuzzle - Cabble tutorial

This demo will show you how to use the geolocalisation filtering with Kuzzle.
It will also show you quite complex process to 

# The three controllers 

The entry point for Cabble is [app.js](../src/app.js).
This file can be resume to the following snippet with Promise :

```javascript
	gisController.init()
		.then(userController.init)
		.then(kuzzleController.init);
```

Corresponding to  :

  * [`gisController`](../src/gisController.js) (gis is for Geolocalisation Information System) is devoted to map rendering and manipulating markers.
Cabble use [Leafletjs](http://leafletjs.com/) for rendering. gisController also use webAPI geolocalisation functionality.
After the `gisController.init` call, the user is geolocalised, and visible on the center of the newly rendered map with [Leafletjs](http://leafletjs.com/),
  * [`userController`](../src/userController.js) allow to deal with localstorage as a persistance user information data.
  After the `userController.init`, if a previous user exist in storage, his id and type are loaded,
  * [`kuzzleController`](../src/kuzzleController.js) is devoted to all the PubSub (Publication Subscription) with Kuzzle.
  After the `kuzzleController.init`, connection to Kuzzle for pubsub positions, user status, and rides are enabled.


We will focus on [`kuzzleController`](../src/kuzzleController.js). When some call will be done to the two other controllers (gisController and userController) we will explain brievely their meaning if ir is not self explanatory.

# The three collections in kuzzleController

Cabble deal with three collections :

```javascript
	CABBLE_COLLECTION_POSITIONS = 'cabble-positions',
	CABBLE_COLLECTION_USERS = 'cabble-users',
	CABBLE_COLLECTION_RIDES = 'cabble-rides';
```

* `CABBLE_COLLECTION_POSITIONS` will be used to synchronize all the users positions on the map. It will also be used to filter all the user from Cabble to only deal with the candidates fitting the bounding box from our current map view.
* `CABBLE_COLLECTION_USERS` will be used to send the change in user status (an user can choose to be a taxi first and then become a customer). In order to leave user focus on his goal, Cabble does not show Taxi if the user is a taxi and vice versa. 
* `CABBLE_COLLECTION_RIDES` will be used to send and update the ride status along it life cicle 



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

Cabble ask for Kuzzle to give to the current user an id if Cabble does not found one in localstorage (see fetchFromLocalStorage in userController for details).
Then Cabble init the publication subscriptions via initPubSub for the three collections :


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

 * the positions pub sub,
 * the user pub sub,
 * the ride pub sub.

## Positions management
Positions collection allow to update the current position of the taxi and customer (publishPositions).
Cabble also use the geolocalisation filtering from Kuzzle to be aware of candidates in the user map bounding box (subscribeToPositions).

### Publish positions

Cabble has to send the positions changes for user in order to synchronize all positions in all other Cabble instance.
To keep it simple Cabble will send position every 3000 milliseconds : 
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

Cabble get information about user id and type from `userController` , current positions from `gisController.geoLoc` and send 
it as a document with `kuzzle.create`. This document will be not persisted in Kuzzle (i.e last argument of `kuzzle.create` is `false`).

<b><a name="pub_room_name" ></a> Sending association between userSubRoomName and userId</b>

A `roomName` attribute is send withing the userId.

```javascript
	userId: userId,
	userSubRoomName: userSubRoomName
```

 This `userSubRoomName` attribute is not important for the positions listening purpose. It is closely related to the user state change listening who come next in the [Users management section](#user_subscription).

### Subscribe To Positions changing

Cabble must propose to the user some "candidates" for a ride in the curent map bounding box.

By candidates, we mean taxis if the current user is a customer and vice versa.

Before describing the susbcribing procedure, let enumerate all the events that can change this filetering.
Cabble has to change filtering for positions every time that user :

 * zoom or move into the map,
 * change the viewport size (by changing browser size, by changing his phone orientation, ...)
 * change from state taxi to customer (if user is a customer, he is interesting for taxi and vice versa, marker on map must reflect that).

To keep it simple, we will not listen to all these events but instead blindly force the filtering to be change every 1000 milliseconds.

```javascript
	// we remove deprecated timer if any first
	if (refreshFilterTimerSubPosition)
		clearInterval(refreshFilterTimerSubPosition);

	refreshFilterTimerSubPosition = setInterval(function() {
		//subscribe for candidates in bounding box for the current user type here.
		...
	}, 1000);
```


The subscribe filter for bounding box with the current use type is computed as follow :

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

Suppose that, looking for distants candidates, the user zoom out into the map.
Cabble does not want to keep tracking for previous deprecated positions change filtering.
To do so Cabble keep the id of the last subscribe and cancel it if exist :

```javascript
	//remove last deprecated subscribe :
	if (positionsSubscribeRoom) {
		kuzzle.unsubscribe(positionsSubscribeRoom);
	}
	//adding a new subscribe :
	positionsSubscribeRoom = kuzzle.subscribe(CABBLE_COLLECTION_POSITIONS, filter,
		....

```

Then Cabble will subscribe for positions change with our current filter.

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
			gisController.addMarker(candidatePosition, candidateType, candidateId);
		}
	});
```


<b> <a name="update_room_name" ></a>Keeping updated the association between userSubRoomName and userId</b>

Cabble update the association between a roomName and the userId. This is unrelated to positions pubSub.
```javascript
	assocRoomToUser[message._source.userSubRoomName] = message._source.userId;
```
It will be used for the [Users management subscription](#user_subscription) purpose who come next.


## Users management

The User management refer to linstening changing of user type.

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

First Cabble set in localstorage the new userType with `userController.setUserType`.
Then it updates the user icon in GIS (in `onUserChangeType`).
It will also remove all the candidates because they now mismatch the user type of interest.
Finally we re-add the `subscribeToUsers` and `subscribeToPositions` because we must 
change theirs filtering accordingly to the new user type.

### <a name="user_subscription" ></a> Subscribe to users change

The subscribing to users change is done with the method `subscribeToUsers`.
This is the tricky part of the Kuzzle code. We will explain here why we have keep an 
association `assocRoomToUser` in the positions management.

```javascript
	subscribeToUsers: function() {
		if (!userController.getUserType())
			return;
		var userStatus = {
			exists: {
				field: 'type'
			}
		};
		if (userSubRoomName)
			kuzzle.unsubscribe(userSubRoomName);

		userSubRoomName = kuzzle.subscribe(CABBLE_COLLECTION_USERS, 
						userStatus, function(error, message) {
			if (error) {
				console.error(error);
				return false;
			}

			//we are interesting in user unscribe i.e user not 
			//subscribing to the 'type' field
			if (!message || message.action != "off")
				return;

			//if this user was not on our map nothing to do
			var userId = assocRoomToUser[message.roomName];
			if (!userId)
				return;
			//else we remove it from the map
			gisController.removeCandidate(userId);
			//if we where also in a ride with this candidate, we must break it
			if (currentRide && (currentRide._source.taxi === userId 
					|| currentRide._source.customer === userId)) {
				kuzzleController.finishRide();
			}
		});
	}
```

The message `message` that we recieve to the end of the subscription do not contain the `userId`. 
But it has the attribute `roomName` that identify uniquely the user.

To found the `userId` from `roomName`, we have keep this association into the object `assocRoomToUser`.
This object `assocRoomToUser` is updated via pub sub Position process :

 * association `userSubRoomName` `userId` in Publish position in the snippet [Sending assoc roomname user id](#pub_room_name) ...
 * ...and are recive on Subscribe to position with the snippet [Keeping updated the association between roomName and userId](#update_room_name)
 

The candidate corresponding to this roomName has send his positions (see the previous section 
and his id. So we have to keep the association between user and rom in `assocRoomToUser`.

Thanks to this `assocRoomToUser`, Cabble retrieve the userid and remove this candidate with mismatching type and remove it from the map with `gisController.removeCandidate(userWithSameStatus);`.


## Rides management

The rides management is closely related to the [overview](./overview.md) :

 * first a ride is <b>proposed</b> by a customer or a taxi, 
 * the ride can be <b>declined</b> by candidate or <b>accepted</b>,
 * if accepted, the ride can be set has <b>ended</b>  anytime by the taxi or the customer.

To deal with the creation of ride (i.e <b>proposed</b>) and with the three state : <b>declined</b>, <b>accepted</b> and <b>completed</b>, we orgnanise Cabble code has follow : 

 * the subscription process `publishRideProposal` will delegate all the states changing in `manageRideProposal`.
 * the creation ride is done in method subsection "Propose a Ride".
 * we have three update process each corresponding to a state changing.
 


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


### Propose a Ride

When the user click on a candidate, he has the possibility to propose a ride.
This will be done by a document creation on the CABBLE_COLLECTION_RIDES in the publishRideProposal method.

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


The Subcription part answer in manageRideProposal is :

```javascript
	if (rideInfo.status.indexOf('proposed_by') !== -1) {
		if (!userController.isAvailable()) {
			this.declineRideProposal(rideProposal);
			return;
		}
	}
```
If user is no availalable (i.e already involve in an other ride), the ride is silently declined.

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


The ride acceptation is define in `acceptRideProposal`.


In this function, we first publish the ride acceptance by updating the document corresponding to the ride.

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