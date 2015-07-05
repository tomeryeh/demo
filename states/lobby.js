function LobbyState() {}
LobbyState.prototype = {
    init: function(initData) {
        this.initData = initData;
        console.log('Init data: ' + initData);
    },
    create: function() {
        musicLobby = game.add.audio('music-lobby');
        if(game.hasMusic) musicLobby.fadeIn();

        /*this.game.kuzzle = new Kuzzle('http://api.uat.kuzzle.io:7512');
        kuzzleGame = this.game;*/

        var filters = {
            "filter": {
                "exists": {
                    "field": "username"
                }
            }
        };

        lobbyGame = game;
        game.gameData.players = [];
        self = this;

        lobbyGame.kuzzle.search('kf-user', filters, function(response) {
            response.result.hits.hits.forEach(function(e, i) {
                lobbyGame.gameData.players.push({
                    id: e._id,
                    name: e._source.username,
                    color: e._source.color
                });
            });
            self.drawLobby();
        });

        this.game.input.onDown.add(this.quitGame, this);
        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enterKey.onDown.add(this.quitGame, this);
    },
    drawLobby: function() {
        var ini = 0.0;
        lobbyGame.gameData.players.forEach(function(e, i) {
            var color = Phaser.Color.getWebRGB(e.color);
            var style = {font: "28px Arial", fill: color, align: "center"};
            var text = game.add.text(game.world.centerX, game.world.centerY, e.name, style);
            text.anchor.set(0.5, ini);
            ini += 0.5;
        });
    },
    quitGame: function() {
        lobbyGame.kuzzle.delete('kf-user', lobbyGame.gameData.player.id, function(response) {
            musicLobby.stop();
            lobbyGame.stateTransition.to('main-menu');
        });
    }
};