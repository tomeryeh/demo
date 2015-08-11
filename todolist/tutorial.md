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

In Angular, for execute a function on initialization, we can add the `ng-init` attribute

```html
<div class="container" ng-controller="todoCtrl" ng-init="init()">
```

In `script.js`, line 13, we define a function `init`

```js
$scope.init = function() {
    getAllTodo();
}
```

We also need an array with all TODO: we create an empty array `$scope.todos` line 8.

```js
$scope.todos = [];
```

<a name="get-all-todo" />
## Function getAllTodo 

In function `getAllTodo` we get all existing TODO.  
For search, we can use the function `search` in the Javascript SDK. This function take three parameters:
* the collection
* a query
* a callback to execute when we have the result
 
```js
kuzzle.search("todo", {}, function(error, response) {

});
```

In the callback we test if there is an error and display it in console.

```js
kuzzle.search("todo", {}, function(error, response) {
    if (error) {
        console.error(error);
        return false;
    }
});
```

We add the line `return false;` for stoping the callback execution and prevent error.

Now, we are sure if the execution continue it's because we have a result, we can loop on all TODOs and add them to the `$scope.todos` array.

```js
var getAllTodo = function() {
  kuzzle.search("todo", {}, function(error, response) {
    if (error) {
      console.error(error);
      return false;
    }

    // The array with all responses is response.hits.hits
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
```

The line `$scope.$apply()` is added just for allow Angular to manually trigger life cycle. See [Angular documentation](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$apply) for more details.

<a name="display-in-view" />
## Display in view

In Angular, when we change the model in javascript, the view is automatically updated. For display the TODO list we loop on all entries and display it with the attribute `ng-repeat`. For each we display a checkbox, the label, and an icon with a trash for delete it.

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

When the user type a new label in form and press enter, we add the new TODO to Kuzzle.  
In Angular we can bind an input with a model in javascript with attribute `ng-model` and we can bind a function when the user click on button or press enter with attribute `ng-click`.

```html
<form class="form-inline">
    <div class="form-group">
        <input type="text" class="form-control" ng-model="newTodo.label" placeholder="something to do..."/>
    </div>
    <button type="submit" class="btn btn-primary" ng-click="addTodo()">Add</button>
</form>
```

In Javascript we can now specify a function `addTodo` that using the function `create` in SDK. This function take four parameters:
* the collection
* the document
* true if we want to persist the document, false if we don't want to persist (default to false)
* an optionnal callback when the create is done

We get information from variable `$scope.newTodo` for send the label typed by user and after that we can reset this variable.

```js
$scope.addTodo = function() {
  kuzzle.create("todo", {type: "todo", label: $scope.newTodo.label, done: false}, true);
  $scope.newTodo = null;
};
```

<a name="update" />
## Update

When a TODO is in the list, the user can check it for mark as done. In the HTML, we add the action to execute:

```html
<td><input type="checkbox" ng-checked="todo.done" ng-click="toggleDone($index)"/></td>
```

And in the javascript, we can implement the function `toggleDone` that send the new TODO 'done' status to Kuzzle:

```js
$scope.toggleDone = function(index) {
  kuzzle.update("todo", {_id: $scope.todos[index]._id, done: !$scope.todos[index].done});
};
```

<a name="delete" />
## Delete

When the user click on the trash, we send to Kuzzle that we want to delete the corresponding TODO.  
First, we add an action on click with the attribute `ng-click`

```html
<p data-placement="top" data-toggle="tooltip" title="" data-original-title="Delete" ng-click="delete($index)">
```

In javascript we can use the method `delete` from SDK for delete a document by its ID

```js
$scope.delete = function(index) {
  kuzzle.delete("todo", $scope.todos[index]._id);
};
```

<a name="real-time" />
# Add real-time

We can list all existing TODO, create, update and delete a TODO. Now we want to display the list dynamicly without reloading the page and share with other users in real time our actions. In Angular initialization, we call the function `subscribe` from the SDK that allow to execute a callback, each time a document matching a filter is create, updated or deleted.  

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
