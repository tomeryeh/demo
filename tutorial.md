# Kuzzle - Cabble tutorial

This demo will show you how to use the geolocalisation filtering.


**Table of content:**

There are three controllers in this demo : 

  * gisController (gis for Geolocalisation Information System) is devoted to details about map rendering and manipulating markers.
We use [Leafletjs](http://leafletjs.com/). We also use geolocalisation functionality (function getGeoLoc).
  * userController is devoted to detail about user information storage (localstorage is used for user persistance).
  * kuzzleController.js kuzzle.js is devoted to all the communication with Kuzzle.


Then we have our entrypoint in app.js.
This file can be resume to the following snippet :

```javascript
	this.gisController.init()
		.then(app.userController.init)
		.then(app.kuzzleController.init);
```

So has a sketch we use Promise style to :

* call the function init from gisController, ie the user will be geolocalised, and visible on the center of the newly rendered map.
* call the function init from userController (if previous user store his id and type (i.e taxi or customer) in localstorage we load them)
* call the function init from kuzzleController (connection to Kuzzle for pubsub about positions, user status and rides change).

Thanks to promise, the inits call chain are synchronous.

We will focus only on kuzzle.js. When some call will be done to the two other controllers (gisController and userController) we will explain brievely their meaning.


## The three rooms Cabble has to deal with

We deal with three rooms for Cabble :

```javascript
	CABBLE_COLLECTION_POSITIONS = 'coding-challenge-cabble-positions',
	CABBLE_COLLECTION_USERS = 'coding-challenge-cabble-users',
	CABBLE_COLLECTION_RIDES = 'coding-challenge-cabble-rides';
```


* CABBLE_COLLECTION_POSITIONS will be used to synchronize all the users positions on the map. It will also be used to filter all the user from Cabble to only deal with the candidates fitting the bounding box from our current map view.
* CABBLE_COLLECTION_USERS will be used to send the change in user status (an user can choose to be a taxi first and then become a customer). In order to leave user focus on his goal, we do not show Taxi if the user is a taxi and vice versa. 
* CABBLE_COLLECTION_RIDES will be used to send and update the ride status along it life cicle 


#Positions management

#Users management

#Rides management


(a ride is first proposed than it can be canceled by user , declined (because user is already in an other ride) or accepted and finally finished).