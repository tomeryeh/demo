# Kuzzle - Chat Tutorial

This demo will show you how to create a simple chat program, with multi-rooms support, using Kuzzle as a back-end.

This tutorial uses the  [Kuzzle Javascript SDK](https://github.com/kuzzleio/sdk-javascript)

**Table of content:**
- [Tutorial structure](#)
- [Connecting to Kuzzle](#)
- [Listening to incoming messages](#)
- [Sending messages to Kuzzle](#)
- [Counting the number of users in our room](#)
- [Multiple rooms support](#)
	- [Getting all documents of a data collection](#)
	- [Creating a new persisted document](#)
	- [Deleting a persisted document](#)

## Tutorial structure

To make a basic chat application work, you need:
* a connection to a back-end server
* a message listener
* a way to send your own messages

Because this tutorial would be very short and dull with these features alone, we added these ones:

* multi-rooms support, allowing users to create, switch and delete rooms
* display the number of users connected to the same room than us

All these features are implemented in the ``js/app.js`` file.

This tutorial will explain all lines of codes involving Kuzzle. There are only a handful of these, every other lines of code in the javascript file handle the chat interface.

## Connecting to Kuzzle

Assuming you have a running Kuzzle instance installed, let's connect our chat application to it.

This is literally the first two lines of our file:

```js
var
  kuzzle = Kuzzle.init('http://localhost:7512'),
```

And... done. You can now send and receive realtime messages, or store and retrieve documents.  

## Listening to incoming messages

The 'listenMessages' function, starting line 16 of the file ``js/app.js``, listen to incoming chat messages and display them in the chat message box.

Kuzzle manages these notifications using *subscriptions*. Unlike a chat application, where you simply subscribe to a *room* or a *topic*, with Kuzzle you subscribe to *documents* instead.

What it means is that, in this function, we'll ask Kuzzle to notify our chat application when messages matching some filters arrive.
Because this chat application has multiple rooms support, we'll filter messages addressed to our current chat room only.

Here is how it works:

* If we have already subscribed to Kuzzle, we unsubscribe first, using the subscription ID provided by Kuzzle when we call the ``subscribe`` function:  
```js
if (subcriptionId) {
	kuzzle.unsubscribe(subcriptionId);
}
```

* We subscribe to our chat messages data collection, named ``CHAT_MSG_COLLECTION``, and only to messages addressed to our current chat room.  
We also provide a callback function, which will be called each time a new message is received, and a subscription ID will be returned to us:  
```js
subcriptionId = kuzzle.subscribe(CHAT_MSG_COLLECTION, {term: {chatRoom: chatRoom}},
	function (error, newMessage) {
```

The rest of this function displays incoming messages.

## Sending messages to Kuzzle

The next function of this tutorial starts at line 49, and is used to send chat messages to Kuzzle.

Since we have configured our chat application to listen to messages sent to the ``CHAT_MSG_COLLECTION`` data collection, and since we filter messages depending on their ``chatRoom`` member, we have to send messages following these rules.

Oh, and we really should include our user name, too, so that each client receiving a message can display it.  
And because we generate a random user color when the chat application starts,  we'll propagate this information too.

This gives us this piece of code:  
```js
var
	message = {
			content: message,
			owner: whoami.userName,
			ownerColor: whoami.userColor,
			chatRoom: whoami.chatRoom
	};

kuzzle.create(CHAT_MSG_COLLECTION, message);
```

By default, the ``create`` function will send a publish/subscribe message, meaning that your message won't be stored. It will only be propagated to listeners, if any.

## Counting the number of users in our room

Next, we want to display the number of users in our room. To do that, we'll simply ask Kuzzle to tell us how many users share the same subscription than us.  
This brings us to the ``updateUserCount`` function, starting line 68 of the file, and to this particular line of code:

```js
kuzzle.countSubscription(subcriptionId, function (error, response) {
```

The subscription ID is the unique identifier of our subscription.  
The callback function is used to display the obtained Kuzzle response.

## Multiple rooms support

Now that we covered subscriptions and publish/subscribe messages, it's time to show you how to deal with persisted documents.

To do that, we'll allow our little chat application to handle multiple rooms. The rooms list will be stored in Kuzzle, using a (very small) document per room, in a data collection stored in the ``CHAT_ROOM_COLLECTION`` global variable.
The next 3 sections will show you how to search, count, store, and delete persisted documents.

### Getting all documents of a data collection

Before manipulating our room documents, we want to display the complete list of available rooms to our users.  
This is what the ``refreshRooms`` function do, starting line 81 of the file.

We won't cover how to get one specific document in this tutorial. Instead, we'll ask Kuzzle to give us all documents stored in the ``CHAT_ROOM_COLLECTION`` data collection:

```js
kuzzle.search(CHAT_ROOM_COLLECTION, {}, function (error, rooms) {
```

Nothing much to say here, expect for the ``{}`` argument: the second argument of the ``search`` method is usually a set of filters. Here we provide Kuzzle with an empty filter, actually asking Kuzzle to retrieve all documents from the data collection.

In the callback function, we scan the ``rooms`` object returned by Kuzzle in order to display all known rooms.  
Each document returned is stored in the ``rooms.hits.hits`` array.

### Creating a new persisted document

Now we'll handle the *create room* button of our chat application, simply by asking our user for a room name, and sending it as a new document to Kuzzle.

The document creation is handled by the ``createRoom`` function, starting line 114.

But before creating this new document, we'll check if this new room doesn't already exist.  
To do that, we'll count how many documents have the property ``name`` equal to our new room name:

```js
var query = {
		query: {
			match: {
				name: newRoomName
			}
		}
	};

kuzzle.count(CHAT_ROOM_COLLECTION, query, function (error, response) {
```

If the returned document count is greater than 0, then a room already exists with the same name and we stop our document creation there.

**Note:** the ``count`` and ``search`` functions behave exactly the same way, the only change is that ``count`` returns a document count, while ``search`` returns all found documents, thus making it slower than ``count``.


Now, all we have to do is to create our new room in Kuzzle. We already covered that part when we explained how to send a publish/subscribe message.  

Well... almost:

```js
kuzzle.create(CHAT_ROOM_COLLECTION, {name: newRoomName}, true, function (error, room) {
```

The difference here is this third argument, set to ``true``. It's the persist flag, and by default it's equal to ``false``.  
Here we ask Kuzzle to not only propagate this document to eventual listeners, but also to store it indefinitely.

The callback is called once the document has been stored in Kuzzle. We use it to automatically switch our user to his newly created room.

### Deleting a persisted document

Now for the last part of this tutorial, we'll show you how to delete a document stored in Kuzzle. And by *a document stored in Kuzzle*, we mean the room our user is currently in.  
It can be done either with a query (exactly like a ``search`` + ``delete`` function), or using the document unique identifier to delete it: one is automatically assigned to every document stored in Kuzzle.

And we made our ``refreshRooms`` and ``createRoom`` functions to store this unique ID, so we'll use it right now, in the ``deleteCurrentRoom`` function (starting line 138):

```js
kuzzle.delete(CHAT_ROOM_COLLECTION, whoami.chatRoomId, function (error, response) {
```

The callback is called once the document has been removed from Kuzzle.

Before calling the ``delete`` method, this function performs a ``countSubscription``, exactly like in the [Counting the number of users in our room](#counting-the-number-of-users-in-our-room) section of this tutorial.  
This is done to ensure an user is alone in the room he wants to remove.
