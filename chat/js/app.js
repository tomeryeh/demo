var
  kuzzle,
  messageFlow = $('#messageFlow'),
  userList = $('#userList'),
  inputArea = $('#inputChatMessage'),
  GLOBAL_CHAT_ROOM = 'demo-kuzzle-chat';

function startDemo(kuzzleUrl) {
  kuzzle = Kuzzle.init(kuzzleUrl);

  createUsername(GLOBAL_CHAT_ROOM, function(error, whoami) {
    listenMessages(GLOBAL_CHAT_ROOM);
    listenUserActivity(GLOBAL_CHAT_ROOM, whoami);

    displayConnectedUsers();

    // Remove our user entry when we leave
    window.onbeforeunload = function () {
      kuzzle.delete('chatRegister', whoami.id);
    };

    // Clicking on the 'Send message' button sends the message
    $('#sendChatMessage').click(function (e) {
      e.preventDefault();
      sendMessage(whoami, inputArea.val());
      inputArea.val("");
    });

    // Pressing enter in the input area sends the message
    inputArea.on('keydown', function (e) {
      // (ENTER key)
      if (e.which == 13) {
        sendMessage(whoami, inputArea.val());
        inputArea.val("");
      }
    });
  });
}

/**
* Listen to incoming chat messages and display them
* Chat messages are publish/subscribe messages
*
* @param {string} chatRoom is the name of the chat room
*/
function listenMessages(chatRoom) {
  kuzzle.subscribe('chatMessage', {term: {chatRoom: chatRoom}}, function (error, newMessage) {
    if (error) {
      throw new Error(error);
    }

    // Autoscroll
    if ((messageFlow[0].scrollHeight - messageFlow.innerHeight()) === messageFlow.scrollTop()) {
      messageFlow.animate({scrollTop: messageFlow[0].scrollHeight}, 300);
    }

    // Appending the received message
    messageFlow.append(
      '<div class="message"><strong style="color: ' +
      newMessage._source.ownerColor +
      ';">' +
      newMessage._source.owner +
      ' :</strong> ' +
      newMessage._source.content +
      '</div>'
    );
  });
}

/**
* Listen to users entering/leaving the chat room.
*/
function listenUserActivity(chatRoom, user) {
  kuzzle.subscribe('chatRegister', {not: {term: {username: user.username}}}, function (error, userActivity) {
    if (error) {
      throw new Error(error);
    }
console.log('DATA RECEIVED: ');
console.dir(userActivity);
    switch (userActivity.action) {
      case 'create':
        userList.append(
          '<div class="user" style="color: ' +
          userActivity._source.chatColor +
          ';" data-userID="' +
          userActivity._id +
          '">' +
          userActivity._source.username +
          '</div>'
        );
        break;
      case 'delete':
        userList.find('[data-userID="' + userActivity._id + '"]').remove();
        break;
    }
  });
}

/**
* Ask the user for an alias and create a new entry in Kuzzle
*
* The callback is called with a User object containing the following members:
*   id
*   username
*   chatRoom
*   chatColor
*/
function createUsername(chatRoom, callback) {
  var
    randomName = Math.floor(Math.random() * 16777215).toString(16),
    searchPattern,
    name,
    userEntry = {
      chatRoom: chatRoom,
      chatColor: '#' + randomName
    };

  do {
    name = prompt('Please enter your name', randomName);
  } while(!name);

  searchPattern = {
    query: {
      bool: {
        must: [
          { match: { username: name } },
          { match: { chatRoom: chatRoom } }
        ]
      }
    }
  };

  kuzzle.count('chatRegister', searchPattern, function (error, searchResult) {
    if (error) {
      callback(error, null);
    }
    else {
      searching = false;
      if (searchResult.count > 0) {
        alert('The name ' + name + ' already exist, please choose another one');
        createUsername(chatRoom, function (error, user) {
          callback(error, user);
        });
        return false;
      }
      else {
        userEntry.username = name;

        // Create the new user entry
        console.log('CREATING USER: ', userEntry);
        kuzzle.create('chatRegister', userEntry, true, function (error, response) {
          if (error) {
            callback(error, response);
          }
          else {
            userEntry.id = response._id;
            callback(null, userEntry);
          }
        });
      }
    }
  });
}

/**
* Retrieve all connected users and display them
*/
function displayConnectedUsers() {
  kuzzle.search('chatRegister', {}, function (error, allUsers) {
    if (error) {
      throw new Error(error);
    }
    else {
      allUsers.hits.hits.forEach(function (user) {
        userList.append(
          '<div class="user" style="color: ' +
          user._source.chatColor +
          ';" data-userID="' +
          user._source._id +
          '">' +
          user._source.username +
          '</div>'
        );
      });
    }
  });
}

/**
* Send the given content to Kuzzle as a pub/sub message
*/
function sendMessage(userInfo, content) {
  var
    message = {
        content: content,
        owner: userInfo.username,
        ownerColor: userInfo.chatColor,
        chatRoom: userInfo.chatRoom
    };

  // Broadcast and reset the input
  kuzzle.create('chatMessage', message);
}
