function LobbyState() {}
LobbyState.prototype = {
    init: function(initData) {
        this.initData = initData;
    },
    create: function() {
        musicLobby = game.add.audio('music-lobby');
        if(game.hasMusic) musicLobby.fadeIn();

        game.player = this.initData.player;

        //kuzzle = new Kuzzle(game.kuzzleUrl);
        kuzzleGame = this.game;

        var filters = {
            "filter": {
                "exists": {
                    "field": "username"
                }
            }
        };

        lobbyGame = game;
        game.room.players = [];
        self = this;

        self.lobbyDrawables = [];

        kuzzle.search('kf-users', filters, function(response) {
            console.log(response);
            response.result.hits.hits.forEach(function(e, i) {
                lobbyGame.room.players.push({
                    id: e._id,
                    username: e._source.username,
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
        var yCoord = -68;
        var delay = 0;
        game.room.players.forEach(function(e, i) {
            var graphics = game.add.graphics();
            graphics.alpha = 0;
            graphics.lineStyle(5, e.color, 1);
            var xCoord = 330;
            if((i + 1) % 2 == 1) {
                xCoord = 20;
                yCoord += 70;
            }
            graphics.beginFill(e.color, 1);
            graphics.drawRect(xCoord, 20 + yCoord, 290, 56);
            graphics.endFill();
            var move = game.add.tween(graphics).to({alpha:1.0}, 250, 'Linear').delay(delay).start();
            move.onComplete.add(function(graphics) {
                game.juicy.shake(10, 5);
                var screenFlash = game.juicy.createScreenFlash(e.color);
                screenFlash.flash(255, 200);
            });
            game.add.tween(graphics).to({y:graphics.y - 10}, 250, Phaser.Easing.Elastic.In).delay(delay).start();

            var color = Phaser.Color.getWebRGB(0x000000);
            var style = {font: "28px Helvetica", fill: color, align: "center"};
            var text = game.add.text(game.world.centerX, game.world.centerY, e.username, style);
            text.x = xCoord + 10;
            text.y = yCoord + 20;
            text.alpha = 0;
            game.add.tween(text).to({alpha:1.0}, 250, 'Linear').delay(delay).start();
            game.add.tween(text).to({y:text.y - 10}, 250, Phaser.Easing.Elastic.In).delay(delay).start();

            self.lobbyDrawables.push(graphics);
            self.lobbyDrawables.push(text);

            if(e.id == game.player.id) {
                self.tweenTint(graphics, e.color, 0xFFFFFF, 500);
                self.tweenTint(text, e.color, 0xFFFFFF, 500);
            }

            delay += 100;
        });
        if(game.room.players.length >= 3) {
            self.countDown();
        }
    },
    countDown: function() {
        initData = {
            player: game.player,
            players: game.room.players
        };
        game.stateTransition.to('game-round-no-monster', true, false, initData);
    },
    tweenTint: function(obj, startColor, endColor, time) {
        // create an object to tween with our step value at 0
        var colorBlend = {step: 0};

        // create the tween on this object and tween its step property to 100
        colorTween = this.game.add.tween(colorBlend).to({step: 100}, time, 'Linear', true, 0, -1);

        // run the interpolateColor function every time the tween updates, feeding it the
        // updated value of our tween each time, and set the result as our tint
        colorTween.onUpdateCallback(function() {
            obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
        });

        // set the object to the start color straight away
        obj.tint = startColor;

        // start the tween
        colorTween.start();
    },
    handleConnect: function() {
        self.lobbyDrawables.forEach(function(e) {
            e.destroy();
        });
        self.lobbyDrawables = [];
        self.drawLobby();
    },
    handleDisconnect: function() {
        self.lobbyDrawables.forEach(function(e) {
            e.destroy();
        });
        self.lobbyDrawables = [];
        self.drawLobby();
    },
    quitGame: function() {
        kuzzle.unsubscribe(game.gameData.player.roomId);
        kuzzle.delete('kf-user', lobbyGame.gameData.player.id, function(response) {
            musicLobby.stop();
            lobbyGame.stateTransition.to('main-menu');
        });
    }
};