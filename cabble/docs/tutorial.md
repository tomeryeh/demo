# Kuzzle - Cabble tutorial

The highlight between Cabble and other demos is the geolocalisation filtering.
It will be explicited in [subscribe to positions changing](#sub_to_pos).


# The three controllers

The entry point for Cabble is [app.js](../src/app.js).
This file can be resume to the following snippet with Promise :

```javascript
	gisController.init()
		.then(userController.init)
		.then(kuzzleController.init);
```

Corresponding to  :

  * [`gisController`](../src/gisController.js) GIS (<b>G</b>eolocalisation <b>I</b>nformation <b>S</b>ystem) is devoted to map rendering and manipulating markers.
Cabble use the awesome [Leafletjs](http://leafletjs.com/) library for rendering. After the `gisController.init` call, the user is geolocalised, and visible on the center of the newly rendered map.
  * [`userController`](../src/userController.js) allow to deal with sessionstorage as a persistance user information data.
  After the `userController.init`, the previous user saved into sessionstorage is loaded.
  * [`kuzzleController`](../src/kuzzleController.js) is devoted to all the PubSub (Publication-Subscription) with Kuzzle.
  After the `kuzzleController.init`, pubsub with Kuzzle for positions, user status, and rides are avaialable.


We will focus our tutorial on [`kuzzleController`](../src/kuzzleController.js). 
When some call will be done to gisController or userController, we will explain brievely their meaning if it is not self explanatory. We always start from an action "scenario" (Sentense starting with "In Cabble" or "User from Cabble") and will explain how this is done with Kuzzle (with a starting sentance "From a Kuzzle point of view....")


# The three collections in kuzzleController

Cabble deal with three concepts, associated to three collections :

* `CABBLE_COLLECTION_POSITIONS` will be used for the geolocalisation.
* `CABBLE_COLLECTION_USERS` will be used to send the change in user status (an user can choose to be a taxi first and then become a customer). In order to leave user focus on his goal, Cabble does not show Taxi if the user is a taxi and vice versa.
* `CABBLE_COLLECTION_RIDES` will be used to send and update the ride status into Cabble.


Pub-sub on this three collections will be done in the init from kuzzleController :
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
						//user has been found in sessionstorage from userController
						kuzzleController.initPubSub();
						resolve();
					}
			});
	}
```

Cabble ask for Kuzzle for an id if no user is already found in sessionstorage (see fetchFromSessionStorage in userController for details). Then Cabble init the publication subscriptions via initPubSub for the three collections :


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

Position Pub-sub management correspond to the position updating process.
It will use the geolocalisation filter from Kuzzle in the Subscribe to users change sub-section.


### Publish a position udpate

A Cabble user want to send his position to all others users, in order to has some ride proposition from a candidate in his vicinity.

From a Kuzzle point of view, this is done by the creation of a non persisted document with some attributes `position`, `type`, `userId`.


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

					//Cabble send a non persistant document : our current position
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

<b>Note</b> : For real time purpose we can use the [watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) from Webapi with Leaflet.js, but to keep it simple Cabble send position every 3000 milliseconds. 



Now that we have a document into Cabble that correspond to the user position, let see how the candidites listen to it.

<a name="sub_to_pos" ></a>
###  Subscribe To Position update


Cabble users want to be aware about all the candidates not too far from him.

From a Kuzzle point of view, this is done by a subscription on documents where position attribute match a filter based on geolocalisation. The subscribe filter for bounding box with the current use type is computed as follow in `subscribeToPositions` :

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

Then he subscribe to this filtering :

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


<b>Note</b> : There are plenty of cases where we have to change the bounding box of interest :

 * zoom or pan into the map,
 * change the viewport size (by changing browser size, by changing the phone orientation, ...)
 * change from state taxi to customer (if user is a customer, he is interesting for taxi and vice versa, marker on map must reflect that).

To keep it simple, we have NOT listen to all these events but instead blindly force the filtering to be change every 10000 milliseconds, see previous snippet.

When Cabble receive a position change for our current filter, we add the candidate or update his position on the map.

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


### Hey ! but what about this `assocRoomToUser` var ?

Yes this pesky variable is present from both publish process and subscribe process, but has nothing to do with pub-sub position, and all with user management who come next.


## Users management

The User management refer to listen to user changing type or disconnection (i.e unscribe to the collection).

### Publish an user change

A Cabble user may want to change from beeing a taxi to beeing a customer and vice versa (as an exemple, the user move from his own town without his car, and so need to be driven).

From a Kuzzle point of view, this is done by updating the document corresponding to the user by changing his type attribute :

```javascript
	publishUserType: function(userType) {
			...

			//userController.getUser().whoami contains the user type information
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


A Cabble user want to be aware about the changing status from user, because a customer is not interseting 
about information from an other customer.


From a Kuzzle point of view, this is done by subscribing to the type changing from the user collection :
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

The user subscribe is only intented to remove the disconnnected candidates, and the candidates having changing theirs types.
This is done by listening to the user collection with a filter `field: 'type'` on action `off`.

### About `assocRoomToUser` updating


`message` variable from previous snippet does not contains the `userId`, but the attribute `roomName`. `roomName` identify uniquely the user too and thanks to this `assocRoomToUser`, Cabble retrieve the `userId` and remove this candidate from the map with `gisController.removeCandidate(userId);`. 


This object `assocRoomToUser` was updated into pub-sub Position process :

 * `userSubRoomName` and `userId` are send with in the snippet From [Publish a position update](#pub_room_name) 
 * and are receive on Subscribe with the snippet from [Subscribe to position udpate](#update_room_name)
 

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


### Propose a Ride pub-sub

In Cabble, when an user click on a candidate icon, a popup appear and the user has the possibility to propose a ride.

From a Kuzzle point of view a ride proposal correspond to the creation of a document `rideproposal` in Kuzzle :

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

### Accept, Decline or Finish  a Ride

In Cabble the user can change the status from a ride proposal anytime, i.e he can accept, decline or gie an and to the ride 

From a Kuzzle point of view, changing the state of a ride correspond to updating the 'status' attribute from the 'ride' document :
As an exemple here is the `finishRide` publication :
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

### Subscribing to the Rides messages

User from Cabble want to be aware about the status (prpose, accept, refused) of all the rides that belong to him.

From a Kuzzle point of view, this is done by listening to all documents from ride collection :

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

		...

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

 * Cabble manage each state changing in `manageRideProposal`, i.e Cabble update the map accordingly.
