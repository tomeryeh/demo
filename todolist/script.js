var kuzzle = Kuzzle.init(config.kuzzleUrl);

angular.module("demo", [])
  .controller("todoCtrl", ["$scope", function($scope) {


    $scope.newTodo = null;
    $scope.todos = [];

    /**
     * Initialize the application: retrieve all stored documents and subscribe to them
     */
    $scope.init = function() {
      getAllTodo();

      kuzzle.subscribe("todo", {term: {type:"todo"}}, function(error, response) {
        if (error) {
          console.error(error);
          return false;
        }

        // In case the action is "create", we call the addToList action
        if(response.action === "create") {
          var newTodo = {
            _id: response._id,
            label: response._source.label,
            done: response._source.done
          };

          addToList(newTodo);
        }

        // In case the action is "delete", we splice the angular model for remove the entry in array
        if(response.action === "delete") {
          $scope.todos.some(function(todo, index) {
            if(todo._id === response._id) {
              $scope.todos.splice(index, 1);
              return true;
            }
          });
        }

        // In case the action is "update", we replace in the angular model with the new one
        if(response.action === "update") {
          $scope.todos.some(function(todo, index) {
            if(todo._id === response._id) {
              $scope.todos[index].done = response._source.done;
              return true;
            }
          });
        }

        // Apply modification in angular model
        $scope.$apply();
      });
    };

    /**
     * This function is triggered when the user click on 'add' button or press enter
     */
    $scope.addTodo = function() {
      kuzzle.create("todo", {type: "todo", label: $scope.newTodo.label, done: false}, true);
      $scope.newTodo = null;
    };

    /**
     * Triggered when the user check/uncheck the 'done' checkbox
     * This function will update the document in Kuzzle
     *
     * @param index
     */
    $scope.toggleDone = function(index) {
      kuzzle.update("todo", {_id: $scope.todos[index]._id, done: !$scope.todos[index].done});
    };

    /**
     * Triggered when the user click on trash button
     * This function will delete the document in Kuzzle
     *
     * @param index
     */
    $scope.delete = function(index) {
      kuzzle.delete("todo", $scope.todos[index]._id);
    };

    /**
     * Add the document in Kuzzle
     *
     * @param todo
     */
    var addToList = function(todo) {
      $scope.todos.push(todo);
    };

    /**
     * Fetch in Kuzzle all documents for the todolist
     */
    var getAllTodo = function() {
      kuzzle.search("todo", {}, function(error, response) {
        if (error) {
          console.error(error);
          return false;
        }

        response.hits.hits.forEach(function(todo) {
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