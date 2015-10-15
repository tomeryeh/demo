var
	_ = require('lodash'),
	CaptainsLog = require('captains-log'),
	logger = CaptainsLog(),
	uuid = require('node-uuid'),
	fs = require('fs'),
	Kuzzle = require('kuzzle-sdk'),
	Players = {},
	Rooms = {},
	Configuration = require('../config.js'),
	kuzzle;

kuzzle = new Kuzzle(Configuration.server.kuzzleUrl);
startServer();

function startServer() {
	logger.info('Listening to client requests...');

	// Listening to connected/disconnected players
	kuzzle
		.dataCollectionFactory(Configuration.server.room)
		.subscribe({}, function (error, data) {
			var
				roomId,
				players = [];

      if (error) {
				logger.error('Catched an error: ', error);
				return false;
			}

			if (data._source && data._source.room && data._source.room.id) {
				return false;
			}

			if (data.action === 'off') {
				removePlayer(data.roomName);
			}

			if (data.action === 'create') {
				roomId = addPlayer(data._source);

				Object.keys(Rooms[roomId].players).forEach(function (p) {
					players.push(Rooms[roomId].players[p]);
				});

				notify(Configuration.server.room, { id: data._source.id, room: Rooms[roomId], players: players });
			}
		}, {listeningToDisconnections: true});
}

function notify(room, message) {
	kuzzle.dataCollectionFactory(room).create(message);
}

function addPlayer(playerData) {
	var room;

	if (Players[playerData.id]) {
		removePlayer(playerData.id);
	}

	room = _.find(Rooms, function (item) {
		return (Object.keys(item.players).length < Configuration.server.maxPlayersPerRoom);
	});

	// No spots found in existing room. Creating a new one...
	if (!room) {
		room = createRoom();
	}

	Players[playerData.id] = room.id;
	room.players[playerData.id] = playerData;
	room.players[playerData.id].hp = Configuration.player.hp;
	room.players[playerData.id].state = 'playing';

	return room.id;
}

function removePlayer(playerId) {
	var roomId;

	if (!Players[playerId]) {
		return false;
	}

	if (Players[playerId]) {
		roomId = Players[playerId];
		notify(roomId, { event: Configuration.events.PLAYER_LEFT, id: playerId });
		delete Rooms[roomId].players[playerId];
	}

	delete Players[playerId];
}

function createRoom () {
	var room = {
		id: uuid.v1(),
		state: 'created',
		players: []
	},
	roomId = room.id,
	subscription;

	logger.info('Creating new room: ', room.id);
	Rooms[room.id] = room;

	subscription = kuzzle.dataCollectionFactory(room.id).subscribe({ exists: { field: 'event' } }, function (error, data) {
		var
			alivePlayer = [];

		if (error) {
			logger.error('Catched an error: ', error);
			return false;
		}

		if (!data._source || !data._source.event) {
			return false;
		}

		switch (data._source.event) {
			case Configuration.events.PLAYER_JOINED:
				logger.info('Player ' + data._source.player.username + ' joined the game');
				if (Object.keys(room.players).length >= Configuration.server.minPlayersPerRoom && room.state !== 'game_launched') {
					// We got enough connected players to start a new game on that room
					startNewGame(room.id);
				}
				break;
			case Configuration.events.PLAYER_LEFT:
				if (room.state === 'game_launched') {
					if (Object.keys(room.players).length < Configuration.server.minPlayersPerRoom) {
						notify(room.id, { event: Configuration.events.NOT_ENOUGH_PLAYERS });
						subscription.unsubscribe();

						Object.keys(room.players).forEach(function (id) {
							delete Players[id];
						});

						logger.info('Not enough players remaining on room ', room.id, '. Destroying it.');
						delete Rooms[room.id];
					}
					else {
						checkWinner(roomId);
					}
				}
				break;
			case Configuration.events.PLAYER_DIE:
				logger.info('Player ' + data._source.player.username + ' died');
				room.players[data._source.player.id].state = 'died';
				checkWinner(room.id);
				break;
		}
	});

	return room;
}

function startNewGame (roomId) {
	var
		modes = [
			{id: 'FFA', label: 'Free for all!'}
		],
		levels = [
			{id: 'CITY', label: 'City'},
			{id: 'KUZZLE', label: 'Kuzzle'},
			{id: 'GLITCH', label: 'Glitch world'}
		],
		room = Rooms[roomId],
		nextTeam = 'blue';

	/*
	 The room has been destroyed between the moment we launched a delayed
	 new game, and the moment the game really starts
  */
	if (!room) {
		return false;
	}

	if (room.players.length > 2 && (room.players.length % 2) === 0) {
			modes.push({id: 'TM', label: 'Team Deathmatch!'});
	}

	room.rules = {
		mode: modes[Math.floor(Math.random() * modes.length)],
		level: levels[Math.floor(Math.random() * levels.length)],
		teams: {
			blue: [],
			red: []
		}
	};

	room.state = 'game_launched';

	_.forEach(_.shuffle(Object.keys(room.players)), function (player) {
		room.players[player].state = 'playing';

		if (room.rules.mode.id === 'TM') {
			room.rules.teams[nextTeam].push(player);
			nextTeam = (nextTeam === 'blue' ? 'red' : 'blue');
		}
	});

	setTimeout(function () {
		logger.info('Room', room.id, ': launching new game');
		notify(room.id, { event: Configuration.events.GAME_START, rules: room.rules });
	}, 5000);
}

function checkWinner(roomId) {
	var
		room = Rooms[roomId],
		teams = {blue: 0, red: 0},
		alivePlayers = [];

	// If only 1 player remains, declare a winner
	Object.keys(room.players).forEach(function (id) {
		if (room.players[id].state === 'playing') {
			alivePlayers.push(id);
		}
	});

	if (Rooms[roomId].rules.mode.id === 'FFA') {
		if (alivePlayers.length === 1) {
			logger.info('Room', roomId, ': player', Rooms[roomId].players[alivePlayers].username, 'wins');
			notify(room.id, { event: Configuration.events.GAME_END, winner: alivePlayers[0] });
			setTimeout(function () {
				startNewGame(roomId);
			}, 5000);
		}
	}
	else if (Rooms[roomId].rules.mode.id === 'TM') {
		alivePlayers.forEach(function (pid) {
			if (_.indexOf(Rooms[roomId].rules.blue, pid) !== -1) {
				teams.blue++;
			}
			else {
				teams.red++;
			}
		});

		if (teams.blue === 0 || teams.red === 0) {
			logger.info('Room', roomId, ': team', (teams.blue !== 0 ? 'blue' : 'red'), 'wins');
			notify(room.id, {event: Configuration.events.GAME_END, winner: (teams.blue !== 0 ? 'blue' : 'red')})
			setTimeout(function () {
				startNewGame(roomId);
			}, 5000);
		}
	}
}
