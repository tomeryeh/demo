var kuzzle = new Kuzzle("http://api.uat.kuzzle.io:7512");

angular.module("chooseyourday", [])
  .controller("chooseyourdayCtrl", ["$scope", function($scope) {

    $scope.newEvent = null;
    $scope.events = [];

    $scope.init = function() {
      getAllEvents();

      kuzzle.subscribe("chooseyourday_event", {term: {type:"chooseyourday_event"}}, function(response) {
        if(response.action === "create") {
          var newEvent = {
            _id: response._id,
            name: response.body.name,
            dates: response.body.dates,
            done: response.body.done
          };

          addToList(newEvent);
        }

        if(response.action === "delete") {
          $scope.events.some(function(event, index) {
            if(event._id === response._id) {
              $scope.events.splice(index, 1);
              return true;
            }
          });
        }

        if(response.action === "update") {
          $scope.events.some(function(event, index) {
            if(event._id === response._id) {
              $scope.events[index].done = response.body.done;
              return true;
            }
          });
        }

        $scope.$apply();
      });
    };
    
    $scope.createEvent = function() {
      if (typeof $scope.newEvent == "undefined" || $scope.newEvent === null) {
        $scope.newEvent = {};
      }

      if (typeof $scope.newEvent.dates == "undefined") {
        $scope.newEvent.dates = [];
      }
      $scope.newEvent.dates[0] = { value: "" };
    };
    
    $scope.cancelNewEvent = function() {
      $scope.newEvent = null;
    }

    $scope.addEvent = function() {
      kuzzle.create("chooseyourday_event", {type: "chooseyourday_event", date: $scope.newEvent.date, name: $scope.newEvent.name, dates: $scope.newEvent.dates, done: false}, true);
      $scope.newEvent = null;
    };
    
    $scope.hasNewEvent = function() {
      return (typeof $scope.newEvent != "undefined" && $scope.newEvent !== null);
    };

    $scope.noNewEvent = function() {
      return !$scope.hasNewEvent();
    };

    $scope.addADay = function() {
      var i = $scope.newEvent.dates.length;
      $scope.newEvent.dates[i] = { value: "" };
    };

    $scope.toggleDone = function(index) {
      kuzzle.update("chooseyourday_event", {_id: $scope.events[index]._id, done: !$scope.events[index].done});
    };

    $scope.delete = function(index) {
      kuzzle.delete("chooseyourday_event", $scope.events[index]._id);
    };

    var addToList = function(event) {
      $scope.events.push(event);
    };

    var getAllEvents = function() {
      kuzzle.search("chooseyourday_event", {}, function(response) {
        response.result.hits.hits.forEach(function(event) {
          var newEvent = {
            _id: event._id,
            title: event._source.name,
            dates: event._source.dates,
            done: event._source.done
          };

          $scope.events.push(newEvent);
        });

        $scope.$apply();
      });
    };

  }]);
