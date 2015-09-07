# Kuzzle - Javascript Game Tutorial

## Difficulty

This tutorial is not *that* difficult, except maybe the part about how to integrates Kuzzle with [Phaser.io](http://phaser.io)

## Prerequisites

Before to dive into this tutorial, you **should** have a look at the other tutorials first, you know, to know how to initialize a connexion to Kuzzle, or all the things you need to do to make Kuzzle alive.

To play with this demo can help to understand things.

## What you will learn here

This tutorial will focus on three aspects:

* [How to listen to document changes](#listen-to-document-changes)
* [How to implement on the go player vs player game rooms](#player-vs-player-rooms)
* [How to mix up Kuzzle with Phaser](#mix-kuzzle-and-phaser)

## Listen to document changes

When you create a document into the datastore, it can be useful to listen to changes on it. For example, when someone has updated a blog article content, you may want to perform some cache clean on your front-end, or when a new player is joining a persistant room, you may want to start the battle, as in this demo.

With Kuzzle, when you want to subscribe to document changes, you will do it via a search filter applied to a collection via the SDK. As you can use filters, you can easily subscribe to one particular document, or a bunch of documents at the same time.

Here is a snippet: 

```javascript
var subscriptionID; // the subscriptionID, given by Kuzzle, will go here

// here is our filter: we want to subscribe to blog posts events
var filters = {
    term: {
        type: "Blog Post"
    }
}

subscriptionID = kuzzle.subscribe(		// we now can subscribe...
	"documents", 						// to the "documents" collection, where the blog documents are stored...
	filters, 							// filtering documents by the previously defined filters...
	function(error, response) {			// with all events handled by this callback
	    if(error) {
	        console.error(error);
	    }
	    console.log(response);			// each time a document is created, updated or deleted, response will contain the event representation.
	    /*
	    
	   		When a document is created, response could be as follow
			{
				requestId: 	"3EF35934-CCA2-4766-8684-701660E4BD57",
				controller: "write",
				action: 	"create",
				collection:	"documents",
				_source: {
					type: "Blog Post",
					author: "Rick Astley",
					title: "Never Gonna Give You Up",
					body: "<p>We're no strangers to love<br>You know the rules and so do I<br>A full commitment's what I'm thinking of<br>You wouldn't get this from any other guy</p>",
					tag: "youHaveBeenRickRolled"
				}
			}

	    */
	}
);
```
As you can see, the controller that will handle documents events is the `subscribe` callback function, and `response` will contain all the useful informations you need, such as:
* the action performed (`create`, `update` or `delete`)
* the full document source, in `_source`

## Player vs Player rooms

In this demo game, like in many others, you will need to create rooms to host player vs player games. 
A room can be seen as a chat room where the game clients are talking about what the players are doing and about their current state. Wen you do so, the first player to join a room is called a "host".

In this demo game, the choice has been made to use the persistent datastorage to store both host list and rooms.

We won't explain how to create persistent documents here, other tutorials based on demos are doing it well, we will focuse on the "how to create game room quickly"

The login behind this can me expressed in pseudo-code as following: 
```
	When a player choose a dificulty level
		look for an available host
		if there is a host
			retrieve his room
			register as a player in this room
			subscribe to this room events
		if no host found
			register as a host
			create the room
			register as a host in this room
			subscribe to this room events
```
You can see this login into the [kuzzle-manager.js](./js/classes/kuzzle-manager.js) file in this demo into [js/classes](./js/classes) the code is relatively explicit.

## Mix Kuzzle and Phaser

This demo is based on the excellent [Phaser.io](http://phaser.io) HTML game framework. Mix Phaser with Kuzzle is not *that* simple, but neither *that* hard.

To create a Phaser game, you will need a main object, containing at least 4 methods : 
* preload: wich aims to perform all... preload things
* create: wich will be create the game itself
* update: wich will call every time the game needs to update
* render: wich will be called every time the game itself will need to be rendered

In this demo, here is the code that do this thing, and can be found in [index.html](index.html)

```javascript
 var game; // greate a global variable for the game
  var arrowHero = function (w, h) { 
      var height = h || $(window).height();		// determine the height and width for the game
      var width = w || $(window).width();
      
      // instantiate the game with the 'kuzzle-game' object
      game = new Phaser.Game(width, height, Phaser.AUTO, 'kuzzle-game');

      // add some "states" wich may be considered as
      // some kind of steps. The goal is to cut the code 
      // in functionnal parts, and make things smooth
      game.state.add('boot', boot);
      game.state.add('preload', preload);
      game.state.add('gametitle', GameTitle);
      game.state.add('howtoplay', HowToPlay);
      game.state.add('kuzzlegame', KuzzleGame);
      game.state.add('gameover', GameOver);

			// call the first state that will call the others when it finish
      game.state.start('boot');
  };

  // start the whole things
  arrowHero();
```

Each stages are taken by Phaser from the js folder.

### Events and dispatch

Each time something happens in this demo, like when someone is throwing a malus to the other player, or (dis)connexions, we must have a way to tell it to other players.
That is really easy with Kuzzle, like in this demo where each events are stored into Kuzzle via persistent documents and are propagated thanks to the subscription to those documents.

To throw an event to the room, you can do like in the demo : 

```javascript 
  /**
   * throw event on the host subchannel room
   * @param eventType
   * @param value
   */
  throwEvent: function(eventType, value) {
    this.kuzzle.create("kg_room_" + this.hostID, {
      event: "kg_event",
      event_type: eventType,
      event_value: value,
      event_owner: KuzzleGame.KuzzleManager.uniquid
    }, false, function(error, response) {
      if (error) {
        console.error(error);
      }
    });
  },
```

To catch the events, you just have to subscribe to the events documents, then parse them to know what to do with them like this : 

```javascript
  /**
   * Subscribe to the host subChannel room
   */
  subscribeToHost: function() {
    var filters = {
      not: {
        term: {
          event_owner: this.uniquid
        }
      },
      term: {
        event: " kg_event"
      }
    };

    this.kuzzle.subscribe("kg_room_" + this.hostID, filters, this.fireEvent);

  },

  /**
   * Catching event
   * @param response
   */
  fireEvent: function(error, response) {

    var eventExploded = response._source.event_type.split('_');

    for (var i = 0; i < eventExploded.length; i++) {
      eventExploded[i] = eventExploded[i].toLowerCase();
      eventExploded[i] = eventExploded[i].charAt(0).toUpperCase() + eventExploded[i].slice(1);
    }

    var eventFunctionName = 'event' + eventExploded.join('');
    KuzzleGame.KuzzleManager.log('Event Fired : ' + response._source.event_type + ' , calling ' + eventFunctionName);

    if ((KuzzleGame.KuzzleManager.isHost && KuzzleGame.KuzzleManager.peering === false) || (!KuzzleGame.KuzzleManager.isHost && KuzzleGame.KuzzleManager.peering === false && KuzzleGame.KuzzleManager.hostID == response._source.event_owner)) {
      KuzzleGame.KuzzleManager.peering = response._source.event_owner;
    }

    if (KuzzleGame.KuzzleManager.peering == response._source.event_owner) {

      window["KuzzleGame"]["KuzzleManager"][eventFunctionName](response._source.event_value);
    }

  },
```
With Kuzzle, all you need to do is to define what kind of event you want to fire and catch.