function LobbyState() {}
LobbyState.prototype = {
    init: function(initData) {
        this.initData = initData;
    },
    preload: function() {
        game.load.audio('countdown', 'assets/sounds/countdown.mp3');
        game.load.bitmapFont('font-lobby', 'assets/fonts/quake.png', 'assets/fonts/quake.fnt');
    },
    create: function() {
        musicLobby = game.add.audio('music-lobby');
        if(game.hasMusic) musicLobby.play();

        audioCountdown = game.add.audio('countdown');

        game.player = this.initData.player;

        kuzzleGame = this.game;

        game.stage.backgroundColor = 0x000000;

        var filtersSearchLobby = {
            "filter": {
                "term": {
                    "roomId": game.player.rid.toLowerCase().replace("-", "")
                }
            }
        };

        filterPixelate3      = new PIXI.PixelateFilter();
        filterPixelate3.size = {x: 3, y: 3};

        lobbyGame = game;
        self = this;

        self.lobbyDrawables = [];

        kuzzle.search('kf-users', filtersSearchLobby, function(error, response) {
            console.log('Users:');
            console.log(response);
            response.hits.hits.forEach(function(e, i) {
                room.players.push({
                    id: e._id,
                    username: e._source.username,
                    color: e._source.color,
                    look: e._source.look
                });
            });
            countdown = game.add.bitmapText(320, 180, 'font-lobby', 'Ready?', 96);
            countdown.alpha = 0.0;
            countdown.filters = [filterPixelate3];
            countdown.anchor.setTo(0.5, 0.5);
            countdown.fixedToCamera = true;
            countdown.scale.set(1.5, 1.5);
            self.drawLobby(false);
        });

        this.quitKey = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
        this.quitKey.onDown.add(this.quitGame, this);

        countingDown = 10;
        isCountingDown = false;
    },
    drawLobby: function(wasCheckingForPlayers) {
        var yCoord = -68;
        var delay = 0;
        room.players.forEach(function(e, i) {
            var graphics = game.add.graphics();
            graphics.z = 0;
            graphics.alpha = 0.0;
            graphics.lineStyle(5, e.color, 1);
            var xCoord = 330;
            if((i + 1) % 2 == 1) {
                xCoord = 20;
                yCoord += 70;
            }
            graphics.beginFill(e.color, 1);
            graphics.drawRect(xCoord, 20 + yCoord, 290, 56);
            graphics.endFill();
            var move = game.add.tween(graphics).to({alpha: 0.6}, 250, 'Linear').delay(delay).start();
            move.onComplete.add(function(graphics) {
                game.juicy.shake(5, 2);
            });
            game.add.tween(graphics).to({y:graphics.y - 10}, 250, Phaser.Easing.Elastic.In).delay(delay).start();

            var color = Phaser.Color.getWebRGB(0xFFFFFF);
            var style = {font: "28px Helvetica", fill: color, align: "center"};
            var text = game.add.text(320, 180, e.username, style);
            text.z = 0;
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
        if(room.players.length >= game.minimumPlayersPerRoom && !isCountingDown) {
            isCountingDown = true;
            if(wasCheckingForPlayers) {
                setTimeout(function () {
                    self.countDown(game.player.wasWaitingToJoin);
                }, 1500);
            } else {
                self.countDown(game.player.wasWaitingToJoin);
            }
        }
    },
    cd: function() {
        console.log(countingDown);
        countdown.text = String.fromCharCode(199) + ' ' + countingDown + '!!';
        game.add.tween(countdown.scale).from({x: 3.0, y: 3.0}, 800, Phaser.Easing.Bounce.Out).start();
        game.add.tween(countdown).to({angle: 350}, 500, 'Elastic').start();
        game.add.tween(countdown).to({alpha: 1.0}, 200, Phaser.Easing.Exponential.Out).start();
        game.add.tween(countdown).to({alpha: 0.0}, 200, Phaser.Easing.Exponential.Out).delay(800).start();
        countingDown--;
        if(countingDown > 0) {
            setTimeout(function () {
                self.cd();
            }, 1000);
        }
    },
    countDown: function(wwtj) {
        if(game.player.isMaster) {
            var roomUpdateQueryReady = {
                _id: game.player.rid,
                status: 'ongoing'
            };
            kuzzle.update('kf-rooms', roomUpdateQueryReady, function() {
                console.log('Sended the ongoing state to current room');
            });
        }
        if(!wwtj) {
            game.player.status = 'joined';
            musicLobby.fadeOut();
            game.add.tween(countdown).to({alpha: 1.0}, 1000, Phaser.Easing.Exponential.Out).start();
            var readyScale = game.add.tween(countdown.scale).to({x: 2.0, y: 2.0}, 1000, Phaser.Easing.Exponential.Out).start();
            readyScale.onComplete.add(function() {
                game.add.tween(countdown).to({alpha: 0.0}, 200, Phaser.Easing.Exponential.Out).start();
            });
            setTimeout(function() {
                audioCountdown.play();

                self.cd();

                setTimeout(function() {
                    initData = {
                        player: game.player,
                        players: room.players,
                        displayWaitingMessage: false
                    };
                    musicLobby.stop();
                    game.stateTransition.to('game-init', true, false, initData);
                }, 10000);
            }, 2000);
        }
        if(wwtj) {
            game.player.wasWaitingToJoin = false;
            musicLobby.stop();
            initData = {
                player: game.player,
                players: room.players,
                displayWaitingMessage: true
            };
            game.stateTransition.to('game-init', true, false, initData);
        }
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
    handleConnect: function(p) {
        room.players.push(p);
        self.lobbyDrawables.forEach(function(e) {
            e.kill();
            e.destroy();
        });
        self.lobbyDrawables = [];
        self.drawLobby(true);
    },
    handleDisconnect: function(p) {
        var index = -1;
        room.players.forEach(function(e, i) {
            if(e.id == p.id) {
                index = i;
            }
        });
        if(index != -1) {
            room.players.splice(index, 1);
        }
        self.lobbyDrawables.forEach(function(e) {
            e.kill();
            e.destroy();
        });
        self.lobbyDrawables = [];
        if(room.players.length < game.minimumPlayersPerRoom) {
            kuzzle.unsubscribe(roomIdPlayers);
            kuzzle.unsubscribe(roomIdRoom);
            var roomUpdateQuery = {
                _id: game.player.rid,
                connectedPlayers: 0
            };
            kuzzle.update('kf-rooms', roomUpdateQuery, function() {
                console.log('Updated connected player count for current room (' + (room.players.length - 1) + ' players remaining)');
                kuzzle.delete('kf-users', game.player.id, function() {
                    console.log('All done!');
                    musicLobby.stop();
                    game.stateTransition.to('not-enough-players');
                });
            });
        } else {
            self.drawLobby(false);
        }
    },
    quitGame: function() {
        console.log('Disconnecting..');
        kuzzle.unsubscribe(roomIdPlayers);
        kuzzle.unsubscribe(roomIdRoom);
        var roomUpdateQuery = {
            _id: game.player.rid,
            connectedPlayers: (room.players.length - 1)
        };
        if(game.player.isMaster && room.players.length > 0) {
            console.log('You were master, now electing a new master');
            room.players.forEach(function(p) {
                if(p.id != game.player.id) {
                    roomUpdateQuery.master = p.id;
                }
            });
        }
        kuzzle.update('kf-rooms', roomUpdateQuery, function() {
            console.log('Updated connected player count for current room (' + (room.players.length - 1) + ' players remaining)');
            kuzzle.delete('kf-users', game.player.id, function() {
                console.log('All done!');
                musicLobby.stop();
                game.state.start('boot',true, false);
            });
        });
    },
    update: function() {
        if(game.time.now > tellThatImConnectedTimer) {
            tellThatImConnectedTimer = game.time.now + tellThatImConnected;
            kuzzle.update('kf-users', {_id: game.player.id, kflastconnected: game.time.now}, function() {
            });
            room.players.forEach(function(p) {
                if(typeof p.kfconnected == "undefined" || isNaN(p.kfconnected)) {
                    p.kfconnected = 0;
                }
                if(typeof p.kflastconnected == "undefined" || isNaN(p.kflastconnected)) {
                    p.kflastconnected = 0;
                }
                if(p.id != game.player.id) {
                    p.kfconnected = p.kfconnected + tellThatImConnected;
                }
            });
        }

        if(game.time.now > checkThatPlayersAreAliveTimer) {
            checkThatPlayersAreAliveTimer = game.time.now + checkThatPlayersAreAlive;
            var filterConnected = {
                "filter": {
                    "term": {
                        "roomId": game.player.rid.toLowerCase().replace("-", "")
                    }
                }
            };
            kuzzle.search('kf-users', filterConnected, function(error, response) {
                response.hits.hits.forEach(function(e, i) {
                    if(e._id != game.player.id) {
                        room.players.forEach(function (p) {
                            if(p.id == e._id && (p.kfconnected - p.kflastconnected > 6000)) {
                                self.handleDisconnect(p);
                                kuzzle.delete('kf-users', p.id, function() { });
                                if(roomMasterId == p.id) {
                                    game.player.isMaster = true;
                                }
                            }
                        });
                    }
                });
            });
        }
    }
};
