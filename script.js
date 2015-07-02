var kuzzle = new Kuzzle("http://localhost:8081");

angular.module("demo", [])
  .controller("todoCtrl", ["$scope", function($scope) {

    $scope.newTodo = null;
    $scope.todos = [];

    $scope.init = function() {
      kuzzle.subscribe("todo", {term: {type:"todo"}}, function(response) {

      });
    };

    $scope.addTodo = function() {
      kuzzle.create("todo", {type: "todo", label :$scope.newTodo.label});
      $scope.newTodo = null;
    };

    $scope.toggleDone = function(index) {
      $scope.todos[index].done = !$scope.todos[index].done;
    };

    $scope.delete = function(index) {
      $scope.todos.splice(index);
    };

    

  }]);