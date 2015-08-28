# Kuzzle - Cabble tutorial

This demo will show you how to use the geolocalisation filtering fro Kuzzle.
It will also show you quite complex process to 


# The three controllers 

  * gisController (gis for Geolocalisation Information System) is devoted to details about map rendering and manipulating markers.
We use [Leafletjs](http://leafletjs.com/) for rendering. We also use webAPI geolocalisation functionality.
  * userController allow to deal with localstorage as a persistance user information data).
  * kuzzleController.js is devoted to all the PubSub (Publication Subscription) with Kuzzle.


Then we have our entrypoint in app.js.
This file can be resume to the following snippet with Promise :

```javascript
	gisController.init()
		.then(userController.init)
		.then(kuzzleController.init);
```

Corresponding roughly to  :

* init the gisController : the user will be geolocalised, and visible on the center of the newly rendered map,
* init the userController : if previous user store is "session" in localstorage we load them,
* init the kuzzleController : connection to Kuzzle for pubsub about positions, user status and rides change.

We will focus on kuzzleController. When some call will be done to the two other controllers (gisController and userController) we will explain brievely their meaning if no self explanatory.

## kuzzleController : The three rooms Cabble has to deal with

We deal with three rooms for Cabble :

```javascript
	CABBLE_COLLECTION_POSITIONS = 'coding-challenge-cabble-positions',
	CABBLE_COLLECTION_USERS = 'coding-challenge-cabble-users',
	CABBLE_COLLECTION_RIDES = 'coding-challenge-cabble-rides';
```


* CABBLE_COLLECTION_POSITIONS will be used to synchronize all the users positions on the map. It will also be used to filter all the user from Cabble to only deal with the candidates fitting the bounding box from our current map view.
* CABBLE_COLLECTION_USERS will be used to send the change in user status (an user can choose to be a taxi first and then become a customer). In order to leave user focus on his goal, we do not show Taxi if the user is a taxi and vice versa. 
* CABBLE_COLLECTION_RIDES will be used to send and update the ride status along it life cicle 


# Positions management

## subscribeToPositions

## publishPositions

# Users management

## subscribeToUsers

## publishUsers

# Rides management

## subscribeToRides

## publishRides


(a ride is first proposed than it can be canceled by user , declined (because user is already in an other ride) or accepted and finally finished).