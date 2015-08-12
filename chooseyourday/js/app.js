var kuzzle = Kuzzle.init("http://api.uat.kuzzle.io:7512");
var kuzzleChannel = "chooseyourday";
var chooseYourDay = angular.module("chooseyourday", [
    "ngRoute",
    "ui.bootstrap.datetimepicker"
]);

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

chooseYourDay.controller("ListEventController", ["$scope", "$location", function ($scope, $location) {
    $scope.events = [];
    $scope.roomId = null;
    $scope.viewForm = false;
    $scope._event = null;
    $scope.isNew = false;

    $scope.init = function () {
        $scope.getAllEvents();
        moment.locale('en');

        $scope.roomId = kuzzle.subscribe(kuzzleChannel, { "term": { type: "chooseyourday_event" } }, function (error, response) {

            if (error) {
                console.error(error);
                return false;
            }

            if (response.action === "create") {
                $scope.addToList(response._id, response._source);
            }

            if (response.action === "delete") {
                $scope.events.some(function (event, index) {
                    if (event._id === response._id) {
                        $scope.events.splice(index, 1);
                        return true;
                    }
                });
            }

            if (response.action === "update") {
                $scope.events.some(function (event, index) {
                    if (event._id === response._id) {
                        $scope.events[index].name = response._source.name;
                        $scope.events[index].dates = response._source.dates;
                        return true;
                    }
                });
            }

            $scope.$apply();
        });
    };

    $scope.$on("$destroy", function() {
        kuzzle.unsubscribe($scope.roomId);
    });

    $scope.getAllEvents = function () {
        kuzzle.search(kuzzleChannel, { "filter": { "term": { type: "chooseyourday_event" } } }, function (error, response) {
            if (error) {
                console.error(error);
                return false;
            }

            response.hits.hits.forEach(function (event) {
                $scope.addToList(event._id, event._source);
            });

            $scope.$apply();
        });
    };

    $scope.addToList = function (id, data) {
        var _event = {
            "_id": id,
            "name": data.name,
            "dates": data.dates
        };

        $scope.events.push(_event);
    };

    $scope.delete = function (index) {
        kuzzle.delete(kuzzleChannel, $scope.events[index]._id);
    };

    $scope.newEvent = function() {
      $scope.isNew = true;
      $scope.viewForm = true;
      $scope._event = {
          "name": "",
          "dates": []
      };
      $scope.addADay();
    }

    $scope.showEvent = function(id) {
      $location.path("/Event/" + id);
    }

    $scope.editEvent = function(id) {
      $scope.isNew = false;
      $scope.viewForm = true;
      kuzzle.get(kuzzleChannel, id, function (error, response) {
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
      });
    }

    $scope.addADay = function (value) {
        if (typeof (value) === "undefined") value = "";
        var i = $scope._event.dates.length;
        $scope._event.dates[i] = { "value": value, "active": true };
    };

    $scope.removeADay = function (index) {
        if ($scope.isNew) {
            if (index !== 0) {
                $scope._event.dates.splice(index, 1);
            }
        } else {
            $scope._event.dates[index].active = false;
        }
    };

    $scope.addEvent = function () {
        if ($scope.isNew) {
            kuzzle.create(kuzzleChannel, {
                "type": "chooseyourday_event",
                "name": $scope._event.name,
                "dates": $scope._event.dates
            }, true);
        } else {
            kuzzle.update(kuzzleChannel, {
                "_id": $scope._event._id,
                "name": $scope._event.name,
                "dates": $scope._event.dates
            });
        }

        $scope._event = null;
        $scope.viewList();
    };

    $scope.viewList = function() {
        $scope.viewForm = false;
    }

}]);

chooseYourDay.controller("EventController", ["$scope", "$location", "$routeParams", function ($scope, $location, $routeParams) {
    $scope.currentEvent = null;
    $scope.participants = [];
    $scope.editingParticipant = "new";
    $scope.newParticipant = null;
    $scope.roomId = null;

    $scope.init = function () {
        kuzzle.get(kuzzleChannel, $routeParams.eventId, function (error, response) {
            if (error) {
                console.error(error);
                return false;
            }

            $scope.currentEvent = {
                "_id": response._id,
                "type": response._source.type,
                "name": response._source.name,
                "dates": response._source.dates
            };

            $scope.initNewParticipant();

            $scope.getAllParticipants();
            $scope.subscribeParticipants();

            $scope.$apply();
        });
    };

    $scope.createParticipant = function () {
        kuzzle.create(kuzzleChannel, {
            "type": "chooseyourday_p",
            "name": $scope.newParticipant.name,
            "dates": $scope.newParticipant.dates,
            "event": $scope.newParticipant.event
        }, true);
        $scope.initNewParticipant();
    };

    $scope.removeParticipant = function (index) {
        kuzzle.delete(kuzzleChannel, $scope.participants[index]._id);
    };

    $scope.initNewParticipant = function () {
        $scope.newParticipant = {
                "type": "chooseyourday_p",
                "name": "",
                "dates": [],
                "event": $scope.currentEvent._id
        };

        angular.forEach($scope.currentEvent.dates, function (value, key) {
            var i = $scope.newParticipant.dates.length;
            $scope.newParticipant.dates[i] = { "value": false };
        });
    };

    $scope.editParticipant = function (index) {
        $scope.editingParticipant = index;
    };

    $scope.updateParticipant = function (participant) {
        kuzzle.update(kuzzleChannel, {
            "_id": participant._id,
            "name": participant.name,
            "dates": participant.dates
        });

        $scope.editingParticipant = 'new';
    };

    $scope.toggleDate = function (date) {
        date.value = !date.value;
    };

    $scope.getAllParticipants = function () {
        var filter = { "filter": { "and": [
            { "term": { "type": "chooseyourday_p" } },
            { "term": { "event": $scope.currentEvent._id } }
        ]}};

        kuzzle.search(kuzzleChannel, filter, function (error, response) {
            if (error) {
                console.error(error);
                return false;
            }

            response.hits.hits.forEach(function (participant) {
                $scope.addToParticipants(participant._id, participant._source);
            });

            $scope.$apply();
        });
    };

    $scope.subscribeParticipants = function () {
        var terms = { "and": [
            { "term": { "type": "chooseyourday_p" } },
            { "term": { "event": $scope.currentEvent._id } }
        ]};

        $scope.roomId = kuzzle.subscribe(kuzzleChannel, terms, function (error, response) {
            if (error) {
                console.error(error);
                return false;
            }

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
                        $scope.participants[index].dates = response._source.dates;
                        return true;
                    }
                });
            }

            $scope.$apply();
        });
    };

    $scope.$on("$destroy", function() {
        kuzzle.unsubscribe($scope.roomId);
    });

    $scope.addToParticipants = function (id, data) {
        var newParticipant = {
            "type": "chooseyourday_p",
            "_id": id,
            "name": data.name,
            "dates": data.dates,
            "event": data.event
        };

        if (typeof newParticipant.dates == "undefined") {
            newParticipant.dates = [];
        }

        while (newParticipant.dates.length < $scope.currentEvent.dates.length) {
            var i = newParticipant.dates.length;
            newParticipant.dates[i] = { "value": false };
        }

        $scope.participants.push(newParticipant);
    };

    $scope.changeView = function (view) {
        $location.path(view);
    };
}]);
