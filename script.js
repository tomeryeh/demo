var kuzzle = new Kuzzle("http://api.uat.kuzzle.io:7512");

angular.module("demo", [])
  .controller("chooseyourdayCtrl", ["$scope", function($scope) {

    $scope.newChooseYourDay = null;
    $scope.chooseyourdays = [];

    $scope.init = function() {
      getAllChooseYourDay();

      kuzzle.subscribe("chooseyourday", {term: {type:"chooseyourday"}}, function(response) {
        if(response.action === "create") {
          var newChooseYourDay = {
            _id: response._id,
            title: response.body.title,
            dates: response.body.dates,
            done: response.body.done
          };

          addToList(newChooseYourDay);
        }

        if(response.action === "delete") {
          $scope.chooseyourdays.some(function(chooseyourday, index) {
            if(chooseyourday._id === response._id) {
              $scope.chooseyourdays.splice(index, 1);
              return true;
            }
          });
        }

        if(response.action === "update") {
          $scope.chooseyourdays.some(function(chooseyourday, index) {
            if(chooseyourday._id === response._id) {
              console.log($scope.chooseyourdays[index]);
              $scope.chooseyourdays[index].done = response.body.done;
              return true;
            }
          });
        }

        $scope.$apply();
      });
    };

    $scope.addChooseYourDay = function() {
      kuzzle.create("chooseyourday", {type: "chooseyourday", date: $scope.newChooseYourDay.date, title: $scope.newChooseYourDay.title, dates: $scope.newChooseYourDay.dates, done: false}, true);
      $scope.newChooseYourDay = null;
    };

    $scope.addADay = function() {
      if (typeof $scope.newChooseYourDay == "undefined" || $scope.newChooseYourDay === null) {
        $scope.newChooseYourDay = {};
      }

      if (typeof $scope.newChooseYourDay.dates == "undefined") {
        $scope.newChooseYourDay.dates = [];
      }

      var i = $scope.newChooseYourDay.dates.length;
      $scope.newChooseYourDay.dates[i] = { value: "" };
    }

    $scope.toggleDone = function(index) {
      kuzzle.update("chooseyourday", {_id: $scope.chooseyourdays[index]._id, done: !$scope.chooseyourdays[index].done});
    };

    $scope.delete = function(index) {
      kuzzle.delete("chooseyourday", $scope.chooseyourdays[index]._id);
    };

    var addToList = function(chooseyourday) {
      $scope.chooseyourdays.push(chooseyourday);
    };

    var getAllChooseYourDay = function() {
      kuzzle.search("chooseyourday", {}, function(response) {
        response.result.hits.hits.forEach(function(chooseyourday) {
          var newChooseYourDay = {
            _id: chooseyourday._id,
            title: chooseyourday._source.title,
            dates: chooseyourday._source.dates,
            done: chooseyourday._source.done
          };

        console.log(chooseyourday);
          $scope.chooseyourdays.push(newChooseYourDay);
        });

        $scope.$apply();
      });
    };

  }]);
