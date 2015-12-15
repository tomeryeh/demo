/**
 * This Todo List demo is based on the Kuzzle JS SDK 1.0.1
 */
angular.module("KuzzleTodoDemo", [])
  // setup kuzzle as an Angular service
  .factory('kuzzle', function () {
    return new Kuzzle(config.kuzzleUrl);
  })
  // KuzzleDataCollection on which the messages are submited
  .factory('kuzzleMessagesCollection', ['kuzzle', function (kuzzle) {
    return kuzzle.dataCollectionFactory('KuzzleTodoDemoMessages');
  }])
  .controller("KuzzleTodoController", ["$scope", 'kuzzleMessagesCollection', function($scope, kuzzleMessagesCollection) {
    $scope.newTodo = null;
    $scope.todos = [];

    $scope.init = function () {
      getAllTodos();

      kuzzleMessagesCollection.subscribe({},
        function(error, response) {
          if (error) {
            console.error("[Kuzzle]:" + error.message);
            return;
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
          $scope.$apply();
        }
      );
    };

    var getAllTodos = function() {
      kuzzleMessagesCollection.advancedSearch({}, function(error, response) {
        if (error) {
          console.error("[Kuzzle]:" + error.message);
          return;
        }

        response.documents.forEach(function(todo) {
          var newTodo = {
            _id: todo.id,
            label: todo.content.label,
            done: todo.content.done
          };

          $scope.todos.push(newTodo);
        });

        $scope.$apply();
      });
    };

    /**
     * This function is triggered when the user click on 'add' button or press enter
     */
    $scope.addTodo = function() {
      kuzzleMessagesCollection.createDocument(
        {type: "todo", label: $scope.newTodo.label, done: false},
        {updateIfExist: true}
      );
      $scope.newTodo = null;
    };

    /**
     * Triggered when the user check/uncheck the 'done' checkbox
     * This function will update the document in Kuzzle
     *
     * @param index
     */
    $scope.toggleDone = function(index) {
      kuzzleMessagesCollection.updateDocument($scope.todos[index]._id, {done: !$scope.todos[index].done});
    };

    /**
     * Triggered when the user click on trash button
     * This function will delete the document in Kuzzle
     *
     * @param index
     */
    $scope.delete = function(index) {
      kuzzleMessagesCollection.deleteDocument($scope.todos[index]._id);
    };

    /**
     * Add the document in Kuzzle
     *
     * @param todo
     */
    var addToList = function(todo) {
      $scope.todos.push(todo);
    };

  }])
