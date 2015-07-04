var kuzzle = new Kuzzle("http://api.uat.kuzzle.io:7512");

angular.module("chooseyourday", [])
  .controller("chooseyourdayCtrl", ["$scope", function($scope) {

    $scope.newEvent = null;
    $scope.events = [];

    $scope.init = function() {
      getAllEvents();

      kuzzle.subscribe("chooseyourday", {term: {type:"chooseyourday_event"}}, function(response) {
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

      $scope.addADay();
    };
    
    $scope.cancelNewEvent = function() {
      $scope.newEvent = null;
    };

    $scope.addEvent = function() {
      console.log($scope.newEvent);
      kuzzle.create("chooseyourday", {type: "chooseyourday_event", date: $scope.newEvent.date, name: $scope.newEvent.name, dates: $scope.newEvent.dates, done: false}, true);
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
      kuzzle.update("chooseyourday", {_id: $scope.events[index]._id, done: !$scope.events[index].done});
    };

    $scope.delete = function(index) {
      kuzzle.delete("chooseyourday", $scope.events[index]._id);
    };

    var addToList = function(event) {
      $scope.events.push(event);
    };

    var getAllEvents = function() {
      kuzzle.search("chooseyourday", {"filter": {"term": {"type": "chooseyourday_event"}}}, function(response) {
        response.result.hits.hits.forEach(function(event) {
          var newEvent = {
            _id: event._id,
            name: event._source.name,
            dates: event._source.dates,
            done: event._source.done
          };

          $scope.events.push(newEvent);
        });

        $scope.$apply();
      });
    };

  }]).directive("dateTimePicker", ["$timeout", function($timeout) {
    return {
      link: function($scope, element, attrs) {
        $(element).datetimepicker({
          locale: 'en',
          useCurrent: true,
          sideBySide: true,
          showClose: true,
          minDate: moment()
        }).on('dp.change', function() {
          $scope.date.value = $(element).find('input').val();
        });
      }
    };
}]);
