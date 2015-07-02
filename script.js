var kuzzle = new Kuzzle("http://localhost:8081");

angular.module("demo", [])
  .controller("todoCtrl", ["$scope", function($scope) {

    $scope.newTodo = null;
    $scope.todos = [];

    $scope.init = function() {
      getAllTodo();

      kuzzle.subscribe("todo", {term: {type:"todo"}}, function(response) {
        console.log(response);
        if(response.action === "create") {
          var newTodo = {
            _id: response._id,
            label: response.body.label,
            done: response.body.done
          };

          addToList(newTodo);
        }

        if(response.action === "delete") {
          $scope.todos.some(function(todo, index) {
            if(todo._id === response._id) {
              $scope.todos.splice(index, 1);
              return true;
            }
          });
        }

        if(response.action === "update") {
          $scope.todos.some(function(todo, index) {
            if(todo._id === response._id) {
              console.log($scope.todos[index]);
              $scope.todos[index].done = response.body.done;
              return true;
            }
          });
        }

        $scope.$apply();
      });
    };

    $scope.addTodo = function() {
      kuzzle.create("todo", {type: "todo", label: $scope.newTodo.label, done: false}, true);
      $scope.newTodo = null;
    };

    $scope.toggleDone = function(index) {
      kuzzle.update("todo", {_id: $scope.todos[index]._id, done: !$scope.todos[index].done, type: "todo"});
    };

    $scope.delete = function(index) {
      kuzzle.delete("todo", $scope.todos[index]._id);
    };

    var addToList = function(todo) {
      $scope.todos.push(todo);
    };

    var getAllTodo = function() {
      kuzzle.search("todo", {}, function(response) {
        response.result.hits.hits.forEach(function(todo) {
          var newTodo = {
            _id: todo._id,
            label: todo._source.label,
            done: todo._source.done
          };

          $scope.todos.push(newTodo);
        });

        $scope.$apply();
      });
    };

  }]);