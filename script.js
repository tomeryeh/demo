angular.module("demo", [])
  .controller("todoCtrl", ["$scope", function($scope) {
    $scope.newTodo = null;
    $scope.todos = [];

    $scope.addTodo = function() {
      $scope.todos.push($scope.newTodo);
      $scope.newTodo = null;
    };

    $scope.toggleDone = function(index) {
      $scope.todos[index].done = !$scope.todos[index].done;
    };

    $scope.delete = function(index) {
      $scope.todos.splice(index);
    };

  }]);