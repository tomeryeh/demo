# Kuzzle - ChooseYourDay Tutorial
<!--Can you see it?-->
This demo will show you how to create a simple doodle-like planning program, with real-time support, using AngularJS as front-end and Kuzzle as a back-end.

This tutorial uses the  [Kuzzle Javascript SDK](https://github.com/kuzzleio/sdk-javascript)

**Table of content:**
* [Requirements and  structure](#requirements-and-client-side-structure)
* [Installation and initialization](#installation-and-initialization)
* [Manage the event list](#manage-the-event-list)
  * [List the available events](#list-the-available-events)
  * [Subscribe to new events](#subscribe-to-new-events)
  * [Add an event](#add-an-event)
  * [Update an event](#update-an-event)
  * [Remove an event](#remove-an-event)
* [Manage an event](#manage-an-event)
  * [List participants](#list-participants)
  * [Subscribe to votes](#subscribe-to-votes)
  * [Vote for a date](#vote-for-a-date)
  * [Update a vote](#update-a-vote)
  * [Remove a participant](#remove-a-participant)

## Requirements and  structure

This tutorial uses following technologies :
* [AngularJS](https://angularjs.org/) for front-end controllers
* a [Datetime Picker for Angular](https://github.com/dalelotts/angular-bootstrap-datetimepicker) (need also bootstrap CSS to work)
* and, of course, Kuzzle for the back-end, and the Kuzzle SDK to speak with it.

The ``index.html`` file contains the loading of required CSS and JS libraries, as well as the main HTML template, with a &lt;div&gt; that will contain the Angular's view :

```html
<div ng-view></div>
```

The code of the tutorial is implemented in the ``js/app.js`` file for the script behaviours, ans in the ``templates/`` folder for the views.

### Disclaimer

In this tutorial, we assume that you already have some basis on AngularJS, and we will essentially focus on the Kuzzle specific code.


## Installation and initialization

### Connection to Kuzzle

Assuming you have a running Kuzzle instance installed (please follow the instructions from [doc/install.md](doc/install.md) to start it), let's setup our client application to connect to it.

This is literally the first line of our ``js/app.js`` file:

```javascript
var kuzzle = Kuzzle.init(config.kuzzleUrl);
```

Just set here the address of your Kuzzle instance... and that's it !


### Angular configuration

In this tutorial, we will implement 2 main features :
* Listing and creating events
* For each event, vote for the perfered dates

Each feature will be implemented by its own controller, accessible via a specific route.
The following lines initialize the ``ngRoute`` configuration for our project :

```javascript
chooseYourDay.config(["$routeProvider",
    function ($routeProvider) {
        $routeProvider.when("/ListEvent", {
            templateUrl: "templates/event_list.html",
            controller: "ListEventController"
        }).when("/Event/:eventId", {
            templateUrl: "templates/event_show.html",
            controller: "EventController"
        }).otherwise({
            redirectTo: "/ListEvent"
        });
    }
]);
```


## Manage the event list

OK, now, we have a running Kuzzle instance, and we have an AngularJS application ready to use it.
It's time to start !

First, we will manager the events list, with the ``ListEventController``.
As shown above, this controller is rendered by the template ``templates/event_list.html``, which contains following lines :

```html
<div ng-init="init()">
  <div ng-hide="viewForm" ng-include="'templates/event_table.html'"></div>
  <div ng-show="viewForm" ng-include="'templates/event_edit.html'"></div>
</div>
```

that means :
* if the varialbe ``viewForm`` is ``true`` => show the template ``event_edit.html``
* if not => show the template ``event_table.html``

### List the available events

At controller's initialization, ``viewForm`` equals ``false``, so we show the template ``templates/event_table.html`` to list the available events.

But how do we get these events ?
That is done by the ``getAllEvents()`` function (lines 71-84) :

```javascript
$scope.getAllEvents = function () {
    kuzzle.search(kuzzleChannel, { "filter": { "term": { type: "chooseyourday_event" } } }, function (error, response) {
      (...)
    });
};
```

We use the [search](https://github.com/kuzzleio/sdk-javascript#search) function of the SDK to filter in our collection (``kuzzleChannel`` variable) the data containing a field "type" with value "chooseyourday_event".

In the callback :
1. handle errors :
```javascript
if (error) {
    console.error(error);
    return false;
}
```
2. iterate through the response, and add each event to our list :
```javascript
response.hits.hits.forEach(function (event) {
    $scope.addToList(event._id, event._source);
});
```
3. apply the scope to view the result in the view :
```javascript
$scope.$apply();
```

### Add an event

OK, we have a nice function to list contents from Kuzzle, but for now, the list is empty !!

To test this first function, we can send data manually with REST requests, but it will be soon painful and boring.
Instead, let's now implement the function to add an event.

For that, first load the "new event" form, with the ``newEvent()`` function (lines 100-108) :

```javascript
$scope.newEvent = function() {
  $scope.isNew = true;
  $scope.viewForm = true;
  $scope._event = {
      "name": "",
      "dates": []
  };
  $scope.addADay();
}
```

This will show the form (``$scope.viewForm = true``), and initialize a new empty event.

The form is rendered by the template ``templates/event_edit.html``.
We will not explain this template in details (it contains a lot a internal features to pick-up a date, add/remove porposed dates, validate input, etc). Just focus on the sumbit button :

```html
<button type="submit" ng-disabled="!eventForm.$valid" class="btn btn-success" ng-click="addEvent()">
(...)
</button>
```

In brief, the form submition triggers the ``addEvent()`` function (lines 149-172), which calls the [create](https://github.com/kuzzleio/sdk-javascript#create) function of the SDK to send the data to Kuzzle:

```
kuzzle.create(kuzzleChannel, {
    "type": "chooseyourday_event",
    "name": $scope._event.name,
    "dates": $scope._event.dates
}, true);
```

### Subscribe to new events

So now, we can add events, and refresh the ``/ListEvent`` page to view our list.
It's cool, but it could be better if we did not need to refresh the page every time to check if there are new events:

So let's use Kuzzle to be notified when changes are made on the data collection.
This is done within the controller initialization, using the [subscribe](https://github.com/kuzzleio/sdk-javascript#subscribe) function of the SDK:

``` javascript
$scope.roomId = kuzzle.subscribe(kuzzleChannel, { "term": { type: "chooseyourday_event" } }, function (error, response) {
  (...)
});
```

In the callback:
1. handle errors:
```javascript
if (error) {
    console.error(error);
    return false;
}
```
2. if we are notified about a new event: add it to the view
```javascript
if (response.action === "create") {
    $scope.addToList(response._id, response._source);
}
```
3. if we are notified about a event that is deleted: remove it from the view
```javascript
if (response.action === "delete") {
    $scope.events.some(function (event, index) {
        if (event._id === response._id) {
            $scope.events.splice(index, 1);
            return true;
        }
    });
}
```
4. if we are notified about an event that is updated: change it within the view
```javascript
if (response.action === "update") {
    $scope.events.some(function (event, index) {
        if (event._id === response._id) {
            $scope.events[index].name = response._source.name;
            $scope.events[index].dates = response._source.dates;
            return true;
        }
    });
}
```
5. apply the changes:
```javascript
$scope.$apply();
```

This function returns an identifier (variable ``roomId``), that enables us to clean up the subscription when we leave the page:

```javascript
$scope.$on("$destroy", function() {
    kuzzle.unsubscribe($scope.roomId);
});
```

Now, we can test the application simultaneously with 2 clients, and enjoy viewing events added in real-time between both clients.

### Update an event

Now, we want to be able to update an event (adding some proposed dates, or change the title for example).
For that, we will reuse the ``event_edit.html`` form, but we have to populate the form data with the existing event.

It is implemented by the ``editEvent()`` function (lines 114-131):

```javascript
$scope.editEvent = function(id) {
  (...)
}
```

1. display the form and tell Angular that it is not a new event :
```javascript
$scope.isNew = false;
$scope.viewForm = true;
```
2. get the event from Kuzzle, using the [get](https://github.com/kuzzleio/sdk-javascript#get) function of the SDK:
```javascript
kuzzle.get(kuzzleChannel, id, function (error, response) {
  (...)
});
```
3. within the callback function, handle errors, and update and apply the scope:
```javascript
if (error) {
    console.error(error);
    return false;
}
$scope._event = {
    "_id": response._id,
    "name": response._source.name,
    "dates": response._source.dates
};
$scope.$apply();
```

Finally, we modify the ``addEvent()`` function to handle the update behaviour, using the [update](https://github.com/kuzzleio/sdk-javascript#update) function of the SDK:

```javascript
$scope.addEvent = function () {
    if ($scope.isNew) {
      (...)
    } else {
        kuzzle.update(kuzzleChannel, {
            "_id": $scope._event._id,
            "name": $scope._event.name,
            "dates": $scope._event.dates
        });
    }
    (...)
};
```

### Remove an event

Finally for this controller, we want to be able to remove an event.

Nothing easier: just call the [delete](https://github.com/kuzzleio/sdk-javascript#delete) function of the SDK (lines 96-98):

```javascript
$scope.delete = function (index) {
    kuzzle.delete(kuzzleChannel, $scope.events[index]._id);
};
```

## Manage an event

So now, we've done with the EventListController. We need now to add the voting feature to let members choose the best date for each event.

We use the same SDK functions for this feature, and the technical logic is quite similar, so we will go faster for this part and just sum up the functions

### List participants

The list of all participants for an event is implemented by the ``getAllParticipants()`` function (lines 250-268):

```javascript
$scope.getAllParticipants = function () {
  (...)
}
```

1. set up the filters:
```javascript
var filter = { "filter": { "and": [
    { "term": { "type": "chooseyourday_p" } },
    { "term": { "event": $scope.currentEvent._id } }
]}};
```
2. call the ``search`` function of the Kuzzle API to update the participant's list and apply the scope:
```javascript
kuzzle.search(kuzzleChannel, filter, function (error, response) {
  (...)
  response.hits.hits.forEach(function (participant) {
      $scope.addToParticipants(participant._id, participant._source);
  });
  $scope.$apply();
});
```

### Subscribe to votes

The subscription to be notified in real-time by new votes is implemented in the ``subscribeParticipants()`` function (lines 270-307):

```javascript
$scope.subscribeParticipants = function () {
  (...)
}
```

1. setup the filters:
```javascript
var terms = { "and": [
    { "term": { "type": "chooseyourday_p" } },
    { "term": { "event": $scope.currentEvent._id } }
]};
```
2. call the ``subscribe`` function of the Kuzzle API and update the participant's list when we are notified for changes:
```javascript
$scope.roomId = kuzzle.subscribe(kuzzleChannel, terms, function (error, response) {
    (...)
    if (response.action === "create") {
        $scope.addToParticipants(response._id, response._source);
    }
    if (response.action === "delete") {
        $scope.participants.some(function (participant, index) {
            if (participant._id === response._id) {
                $scope.participants.splice(index, 1);
                return true;
            }
        });
    }
    if (response.action === "update") {
        $scope.participants.some(function (participant, index) {
            if (participant._id === response._id) {
                $scope.participants[index].name = response._source.name;
                $scope.participants[index].answers = response._source.answers;
                return true;
            }
        });
    }
    $scope.$apply();
});
```


### Vote for a date

A new vote is handle by the ``createParticipant()`` function (lines 204-212), which uses the ``create`` function of the Kuzzle SDK:

```javascript
$scope.createParticipant = function () {
    kuzzle.create(kuzzleChannel, {
        "type": "chooseyourday_p",
        "name": $scope.newParticipant.name,
        "answers": $scope.newParticipant.answers,
        "event": $scope.newParticipant.event
    }, true);
    $scope.initNewParticipant(); // reinitialize the "new participant" form.
};
```

### Update a vote

We can also modify an existing vote with the ``updateParticipant()`` function (lines 236-244), which uses the ``update`` function of the Kuzzle SDK:

```javascript
kuzzle.update(kuzzleChannel, {
    "_id": participant._id,
    "name": participant.name,
    "answers": participant.answers
});
```

### Remove a participant

And finally, to remove a participant to an event, it's that easy:

```javascript
$scope.removeParticipant = function (index) {
    kuzzle.delete(kuzzleChannel, $scope.participants[index]._id);
};
```
