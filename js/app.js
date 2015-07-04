var kuzzle = new Kuzzle("http://api.uat.kuzzle.io:7512");
var chooseYourDay = angular.module("chooseyourday", [
    'ngRoute'
]);

chooseYourDay.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/EventList', {
            templateUrl: 'templates/event_list.html',
            controller: 'EventListController'
        }).when('/AddEvent', {
            templateUrl: 'templates/show_orders.html',
            controller: 'AddEventController'
        }).otherwise({
            redirectTo: '/EventList'
        });
    }
]);

chooseYourDay.controller("EventListController", ["$scope", '$http', function ($scope) {
    $scope.events = [];

    $scope.init = function () {
        $scope.getAllEvents();

        kuzzle.subscribe("chooseyourday", { term: { type: "chooseyourday_event" } }, function (response) {
            if (response.action === "create") {
                $scope.addToList(response.body);
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
                        $scope.events[index].done = response.body.done;
                        return true;
                    }
                });
            }

            $scope.$apply();
        });
    };

    $scope.getAllEvents = function () {
        kuzzle.search("chooseyourday", { "filter": { "term": { "type": "chooseyourday_event" } } }, function (response) {
            response.result.hits.hits.forEach(function (event) {
                $scope.addToList(event._source);
            });

            $scope.$apply();
        });
    };

    $scope.addToList = function (data) {
        var newEvent = {
            name: data.name,
            dates: data.dates
        };

        $scope.events.push(newEvent);
    };

    $scope.delete = function (index) {
        kuzzle.delete("chooseyourday", $scope.events[index]._id);
    };
}]);

chooseYourDay.controller("AddEventController", ["$scope", '$http', function ($scope) {
    $scope.init = function () {
        if (typeof $scope.newEvent == "undefined" || $scope.newEvent === null) {
            $scope.newEvent = {};
        }

        if (typeof $scope.newEvent.dates == "undefined") {
            $scope.newEvent.dates = [];
        }

        $scope.addADay();
    };

    $scope.addADay = function () {
        var i = $scope.newEvent.dates.length;
        $scope.newEvent.dates[i] = { value: "" };
    };

    $scope.addEvent = function () {
        console.log($scope.newEvent);
        kuzzle.create("chooseyourday", { type: "chooseyourday_event", date: $scope.newEvent.date, name: $scope.newEvent.name, dates: $scope.newEvent.dates, done: false }, true);
        $scope.newEvent = null;
    };

    $scope.newEvent = null;

    $scope.cancelNewEvent = function () {
        $scope.newEvent = null;
    };
}]);

chooseYourDay.directive("dateTimePicker", ["$timeout", function ($timeout) {
    return {
        link: function ($scope, element, attrs) {
            $(element).datetimepicker({
                locale: 'en',
                useCurrent: true,
                sideBySide: true,
                showClose: true,
                minDate: moment()
            }).on('dp.change', function () {
                $scope.date.value = $(element).find('input').val();
            });
        }
    };
}]);