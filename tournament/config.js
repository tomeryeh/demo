var Configuration = {
	gameOptions: {
		music: false,
		fullscreen: false,
	},

	server: {
		room: 'tournament-server-room',
		minPlayersPerRoom: 2,
		maxPlayersPerRoom: 8,
		kuzzleUrl: 'http://localhost:7512'
	},

	player: {
		hp: 80
	},

	events: {
		PLAYER_JOINED: 1,
		PLAYER_LEFT: 2,
		NOT_ENOUGH_PLAYERS: 3,
		GAME_START: 4,
		GAME_END: 5,
		PLAYER_UPDATE: 6,
		PLAYER_DIE: 7,
	}
};

(function () {
  if (typeof module === 'object' && module.exports) {
	module.exports = Configuration;
  }
})();