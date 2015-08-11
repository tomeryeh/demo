var kuzzle = new Kuzzle("http://api.uat.kuzzle.io:7512");
var kuzzleChannel = "chooseyourday";
var chooseYourDay = angular.module("chooseyourday", [
    "ngRoute"
]);

chooseYourDay.config(["$routeProvider",
    function ($routeProvider) {
        $routeProvider.when("/ListEvent", {
            templateUrl: "templates/event_list.html",
            controller: "ListEventController"
        }).when("/AddEvent", {
            templateUrl: "templates/add_event.html",
            controller: "AddEventController"
        }).when("/EditEvent/:eventId", {
            templateUrl: "templates/add_event.html",
            controller: "AddEventController"
        }).when("/OpenEvent/:eventId", {
            templateUrl: "templates/open_event.html",
            controller: "OpenEventController"
        }).otherwise({
            redirectTo: "/ListEvent"
        });
    }
]);

chooseYourDay.controller("ListEventController", ["$scope", "$location", function ($scope, $location) {
    $scope.events = [];
    $scope.roomId = null;

    $scope.init = function () {
        $scope.getAllEvents();
        
        $scope.roomId = kuzzle.subscribe(kuzzleChannel, { "term": { type: "chooseyourday_event" } }, function (response) {
            if (response.action === "create") {
                $scope.addToList(response._id, response.body);
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
                        $scope.events[index].name = response.body.name;
                        $scope.events[index].dates = response.body.dates;
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
        kuzzle.search(kuzzleChannel, { "filter": { "term": { type: "chooseyourday_event" } } }, function (response) {
            response.result.hits.hits.forEach(function (event) {
                $scope.addToList(event._id, event._source);
            });

            $scope.$apply();
        });
    };

    $scope.addToList = function (id, data) {
        var newEvent = {
            "_id": id,
            "name": data.name,
            "dates": data.dates
        };

        $scope.events.push(newEvent);
    };

    $scope.delete = function (index) {
        kuzzle.delete(kuzzleChannel, $scope.events[index]._id);
    };

    $scope.changeView = function (view) {
        $location.path(view);
    };
}]);

chooseYourDay.controller("AddEventController", ["$scope", "$location", "$routeParams", function ($scope, $location, $routeParams) {
    $scope.newEvent = null;
    $scope.isNew = false;

    $scope.init = function () {
        var $eventId = $routeParams.eventId;

        if ($eventId === "new") {
            $scope.isNew = true;
            $scope.newEvent = {
                "name": "",
                "dates": []
            };

            $scope.addADay();
        } else {
            kuzzle.get(kuzzleChannel, $eventId, function (response) {
                $scope.newEvent = {
                    "_id": response.result._id,
                    "name": response.result._source.name,
                    "dates": response.result._source.dates
                };

                $scope.$apply();
            });
        }
    };

    $scope.addADay = function (value) {
        if (typeof (value) === "undefined") value = "";
        var i = $scope.newEvent.dates.length;
        $scope.newEvent.dates[i] = { "value": value, "active": true };
    };

    $scope.removeADay = function (index) {
        if ($scope.isNew) {
            if (index !== 0) {
                $scope.newEvent.dates.splice(index, 1);
            }
        } else {
            $scope.newEvent.dates[index].active = false;
        }
    };

    $scope.addEvent = function () {
        if ($scope.isNew) {
            kuzzle.create(kuzzleChannel, {
                "type": "chooseyourday_event",
                "name": $scope.newEvent.name,
                "dates": $scope.newEvent.dates
            }, true);
        } else {
            kuzzle.update(kuzzleChannel, {
                "_id": $scope.newEvent._id,
                "name": $scope.newEvent.name,
                "dates": $scope.newEvent.dates
            });
        }

        $scope.newEvent = null;
        $location.path("/ListEvent");
    };

    $scope.cancelNewEvent = function () {
        $scope.newEvent = null;
    };

    $scope.changeView = function (view) {
        $location.path(view);
    };
}]);

chooseYourDay.controller("OpenEventController", ["$scope", "$location", "$routeParams", function ($scope, $location, $routeParams) {
    $scope.currentEvent = null;
    $scope.participants = [];
    $scope.editingParticipant = "new";
    $scope.newParticipant = null;
    $scope.roomId = null;

    $scope.init = function () {
        kuzzle.get(kuzzleChannel, $routeParams.eventId, function (response) {
            $scope.currentEvent = {
                "_id": response.result._id,
                "type": response.result._source.type,
                "name": response.result._source.name,
                "dates": response.result._source.dates
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

        kuzzle.search(kuzzleChannel, filter, function (response) {
            response.result.hits.hits.forEach(function (participant) {
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

        $scope.roomId = kuzzle.subscribe(kuzzleChannel, terms, function (response) {
            if (response.action === "create") {
                $scope.addToParticipants(response._id, response.body);
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
                        $scope.participants[index].name = response.body.name;
                        $scope.participants[index].dates = response.body.dates;
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

chooseYourDay.directive("dateTimePicker", ["$timeout", function ($timeout) {
    return {
        link: function ($scope, element, attrs) {
            $(element).datetimepicker({
                locale: "en",
                useCurrent: true,
                sideBySide: true,
                showClose: true,
                minDate: moment()
            }).on("dp.update", function () {
                $scope.date.value = $(element).find("input").val();
            }).on("dp.show", function () {
                $scope.date.value = $(element).find("input").val();
            }).on("dp.hide", function () {
                $scope.date.value = $(element).find("input").val();
            });
        }
    };
}]);