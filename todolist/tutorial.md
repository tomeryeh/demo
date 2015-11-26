Kuzzle - TODO List tutorial
===

The main purpose of this file is to learn how to use Kuzzle by creating a clone of this TODO list.  
In this example, we'll use the [Javascript SDK](https://github.com/kuzzleio/sdk-javascript).

* [Application initialization](#app-init)
    * [Angular initialization](#angular-init)
    * [Function getAllTodo](#get-all-todo)
    * [Display in view](#display-in-view)
* [Push](#push)
    * [Create](#create)
    * [Update](#update)
    * [Delete](#delete)
* [Add real-time](#real-time)

<a name="app-init" />
# Application initialization

<a name="angular-init" />
## Angular initialization

In Angular, to execute a function on initialization, we can add the `ng-init` attribute. This is where we kickstart everything.

```html
<div class="container" ng-controller="KuzzleTodoController" ng-init="init()">
```

Now,let's take a look at our Controller script `app.js`.
First, need an array to store all our TODOs: we create an empty array `$scope.todos` on line 15.

```js
$scope.todos = [];
```

Our TODOs will be managed by the `KuzzleTodoDemoMessages` collection in Kuzzle: to easily access it we have created an Angular factory that injects it into our controller.

```js
// setup kuzzle as an Angular service
.factory('kuzzle', function () {
  return new Kuzzle(config.kuzzleUrl);
})
// KuzzleDataCollection on which the messages are submitted
.factory('kuzzleMessagesCollection', ['kuzzle', function (kuzzle) {
  return kuzzle.dataCollectionFactory('KuzzleTodoDemoMessages');
}])
```

One convenient thing to know here is that we don't have to explicitly create our collection to work with it: Kuzzle does it seamlessly for us.

On line 17, we define the `init` function. The first thing we need to do when initializing our app, is to fetch all the existing TODOs:

```js
$scope.init = function() {
    getAllTodo();
}
```

<a name="get-all-todo" />
## Function getAllTodos

To do so, we ask Kuzzle to get us all the existing documents in the `KuzzleTodoDemoMessages` collection.
The method that the Javascript SDK provides for this purpose is [`advancedSearch`](https://kuzzleio.github.io/sdk-documentation/#advancedsearch).
It takes the following arguments:

* a query filter (since we want all the documents, we leave it empty),
* a callback to execute when the result is available.

```js
kuzzleMessagesCollection.advancedSearch({}, function(error, response) {

});
```

In the callback we test if there is an error and display it in console.

```js
kuzzleMessagesCollection.advancedSearch({}, function(error, response) {
  if (error) {
      console.error(error);
      return false;
  }
});
```

We add the line `return false;` to stop the callback execution and prevent error.

Now that we are sure to have a result, we can loop on all TODOs and add them to the `$scope.todos` array.

```js
var getAllTodos = function() {
  kuzzleMessagesCollection.advancedSearch({}, function(error, response) {
    if (error) {
      console.error(error);
      return false;
    }

    // The array with all responses is response.hits.hits
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
```

The line `$scope.$apply()` is added to allow Angular to manually update the view. See [Angular documentation](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$apply) for more details.

<a name="display-in-view" />
## Display in view

To display the TODO list we loop on all entries and display it with the attribute `ng-repeat`. For each entry we display a checkbox, the label, and an trash icon to delete it.

```html
<tr ng-repeat="todo in todos" ng-class="{success: todo.done}">
    <td><input type="checkbox" ng-checked="todo.done"/></td>
    <td>{{ todo.label }}</td>
    <td>
        <p data-placement="top" data-toggle="tooltip" data-original-title="Delete">
            <button class="btn btn-danger btn-xs" data-title="Delete" data-toggle="modal" data-target="#delete">
                <span class="glyphicon glyphicon-trash"></span>
            </button>
        </p>
    </td>
</tr>
```

<a name="push" />
# Push

<a name="create" />
## Create

When the user types a new label in the form and press enter, we add the new TODO to our collection in Kuzzle.  
In Angular we can bind an input with a model using the attribute `ng-model` and we can bind a function when the user clicks on a button or presses enter with attribute `ng-click`.

```html
<form class="form-inline">
    <div class="form-group">
        <input type="text" class="form-control" ng-model="newTodo.label" placeholder="something to do..."/>
    </div>
    <button type="submit" class="btn btn-primary" ng-click="addTodo()">Add</button>
</form>
```

In our Controller, we can now declare a function `addTodo` that using the `createDocument` method of the SDK. This function takes the following arguments:
* a plain object describing the KuzzleDocument to create,
* an options object,
* an optional callback (we don't use it here).

We read `$scope.newTodo` to get the content of the TODO to be created, then we reset it.

```js
$scope.addTodo = function() {
  kuzzleMessagesCollection.createDocument(
    {type: "todo", label: $scope.newTodo.label, done: false},
    {updateIfExist: true}
  );
  $scope.newTodo = null;
};
```

<a name="update" />
## Update

Users can mark TODOs as done. In the HTML, we add the action to execute:

```html
<td><input type="checkbox" ng-checked="todo.done" ng-click="toggleDone($index)"/></td>
```

And in our Controller, we can implement the function `toggleDone` that updates the TODO backend-side by calling `updateDocument` on the SDK. This method takes the following arguments:
* the id of the document to update,
* an object describing the properties to be updated on the object.

```js
$scope.toggleDone = function(index) {
  kuzzleMessagesCollection.updateDocument($scope.todos[index]._id, {done: !$scope.todos[index].done});
};
```

<a name="delete" />
## Delete

When the user clicks on the trash icon, we notify Kuzzle that we want to delete the corresponding TODO.  
First, we add an action with the attribute `ng-click`

```html
<p data-placement="top" data-toggle="tooltip" title="" data-original-title="Delete" ng-click="delete($index)">
```

In our Controller, we can call the `deleteDocument` method on SDK to delete a document by id.

```js
$scope.delete = function(index) {
  kuzzleMessagesCollection.deleteDocument($scope.todos[index]._id);
};
```

<a name="real-time" />
# Add real-time

We have just seen how we can list, create, update and delete TODOs. Now we want our TODO list to be dynamically bound with the server-side state, so that we can instantly see the effect of other users' actions without reloading the page. In our `$scope.init` method, we `subscribe` all the changes on our collection so that a callback is executed each time a document is created, updated or deleted.

Above, in our document we had add a fake type 'todo' attribute for filter on it (because in Kuzzle version 0.2.0, we can't subscribe to a whole collection without apllying a filter). We can create a subscribe:

```js
kuzzle.subscribe("todo", {term: {type:"todo"}}, function(error, response) {
    if (error) {
      console.error(error);
      return false;
    }
});
```

In the callback, the response parameter contain the document and also the action. When an another user create a TODO, the response will contain the document and 'create' in action. If another user delete a TODO, the action is equal to 'delete' and so on. In the callback we can test this variable and do the corresponding action:

* If the action is `create`, we add the new TODO into the list

    ```js
    if(response.action === "create") {
      var newTodo = {
        _id: response._id,
        label: response._source.label,
        done: response._source.done
      };

      addToList(newTodo);
    }
    ```

* If the action is `delete`, we search the corresponding TODO in the list and we remove it

    ```js
    if(response.action === "delete") {
      $scope.todos.some(function(todo, index) {
        if(todo._id === response._id) {
          $scope.todos.splice(index, 1);
          return true;
        }
      });
    }
    ```

* If the action is `update`, we search the corresponding TODO and we update it

    ```js
    if(response.action === "update") {
      $scope.todos.some(function(todo, index) {
        if(todo._id === response._id) {
          $scope.todos[index].done = response._source.done;
          return true;
        }
      });
    }
    ```

In any case, because we have made an update in the Angular model in an asynchrone function, we have to manually trigger life cycle with `$scope.$apply();`. (You can have a look at the whole callback line 16-55)

THAT'S ALL !

We can create, update or delete a TODO and because we have subscribed to the corresponding filter, we'll be notified for all modifications (and also our modifications).
