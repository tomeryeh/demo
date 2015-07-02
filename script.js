//var kuzzle = new Kuzzle("http://localhost:8081");

angular.module("demo", [])
  .controller("todoCtrl", ["$scope", function($scope) {

    $scope.newTodo = null;
    $scope.todos = [];

    $scope.init = function() {

    };

    $scope.addTodo = function() {
      addToList($scope.newTodo);
      $scope.newTodo = null;
    };

    $scope.toggleDone = function(index) {
      $scope.todos[index].done = !$scope.todos[index].done;
    };

    $scope.delete = function(index) {
      $scope.todos.splice(index);
    };

    var addToList = function(todo) {
      $scope.todos.push(todo);
    };

  }]);