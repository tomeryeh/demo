var live = false;
function GameInitState() {}
GameInitState.prototype = {
    init: function (initData) {
        self = this;
        roundData = initData;
    },
    preload: function() {
        game.load.image('please-wait', 'assets/sprites/please-wait.png');
    },
    create: function() {
        musicInit = this.game.add.audio('music-game');
        if(this.game.hasMusic) musicInit.play();

        room.params = null;

        game.stage.backgroundColor = 0x000000;

        room.params = null;

        if(roundData.displayWaitingMessage) {
            console.log('Waiting for players..');
            pleaseWait = game.add.sprite(100, 60, 'please-wait');
            pleaseWait.alpha = 0.0;
            pleaseWait.scale.set(0.0, 0.0);
            game.add.tween(pleaseWait.scale).to({x: 0.8, y: 0.8}, 1000, Phaser.Easing.Bounce.Out, true);
            game.add.tween(pleaseWait).to({angle: 1080}, 1000, Phaser.Easing.Elastic.Out, true);
            game.add.tween(pleaseWait).to({alpha: 1.0}, 1000, Phaser.Easing.Exponential.Out, true);
        }

        if(game.player.isMaster) {
            console.log('Generating rules..');
            room.params = self.generateRoundRules();
            var updateQuery = {
                _id: game.player.rid,
                rid: game.player.rid,
                params: room.params,
                roundReady: true,
                showWinner: false,
                ending: null
            };
            if(room.params.rules.id == 'TM') {
                self.shufflePlayers(room.players);
                var blueTeam = [];
                var redTeam = [];
                room.players.forEach(function(p, i) {
                    if(i % 2 === 0)
                        blueTeam.push(p.id);
                    else
                        redTeam.push(p.id)
                });
                var teams = {
                    red: redTeam,
                    blue: blueTeam
                };
                room.params.teams = teams;
            }
            setTimeout(function() {
                kuzzle.update('kf-rooms', updateQuery, function () {
                    console.log('Pushed new game round rules to other players');
                });
            }, 2000);
        } else {
            console.log('Waiting for round rules from Kuzzle..');
        }

        var color = Phaser.Color.getWebRGB(0xFFFFFF);
        var style = {font: "24px Helvetica", fill: color, align: "center"};

        initRules = game.add.text(50, 100, 'Test', style);
        initRules.alpha = 0.0;

        initLevel = game.add.text(50, 100 + 100, 'Test', style);
        initLevel.alpha = 0.0;
    },
    generateRoundRules: function() {
        var modes = [
            {id: 'FFA', label: 'Free for all!'}
        ];
        var foundMe = false;
        room.players.forEach(function(p) {
            if(p.id == game.player.id)
                foundMe = true;
        });
        if(!foundMe)
            room.players.push(game.player);
        if(room.players.length >= 2 && (room.players.length % 2 == 0)) {
            modes.push({id: 'TM', label: 'Team match!'});
        }
        var levels = [
            {id: 'CITY', label: 'City'},
            {id: 'KUZZLE', label: 'Kuzzle'},
            {id: 'GLITCH', label: 'Glitch world'}
        ];

        return {
            rules: modes[Math.floor(Math.random() * modes.length)],
            level: levels[Math.floor(Math.random() * levels.length)]
        };
    },
    runGameRound: function() {
        console.log('Round ready, now starting!');

        if(typeof pleaseWait != "undefined") {
            pleaseWait.alpha = 0.0;
        }

        initRules.text = 'Rules: ' + room.params.rules.label;
        initLevel.text = 'Level: ' + room.params.level.label;

        game.add.tween(initRules.scale).to({x: 2.0, y: 2.0}, 1000, 'Bounce').start();
        game.add.tween(initRules).to({alpha: 1.0}, 500, 'Linear').start();

        var levelScaleIn = game.add.tween(initLevel.scale).to({x: 2.0, y: 2.0}, 1000, 'Bounce').delay(500).start();
        game.add.tween(initLevel).to({alpha: 1.0}, 500, 'Linear').delay(500).start();

        levelScaleIn.onComplete.add(function() {
            setTimeout(function() {
                roundData.params = room.params;
                musicInit.stop();
                game.stateTransition.to('game-round-no-monster', true, false, roundData);
            }, 2000);
        }, this);
    },
    shufflePlayers: function(_players) {
        for(var j, x, i = _players.length; i; j = Math.floor(Math.random() * i), x = _players[--i], _players[i] = _players[j], _players[j] = x);
        return _players;
    },
    handleConnect: function(p) {
        console.log('Player connected: ' + p.username);
        var newPlayer = {
            id             : p.id,
            look           : p.look,
            kflastconnected: 0,
            kfconnected    : 0,
            username       : p.username,
            isAlive        : true,
            color          : p.color,
            team           : null
        };

        room.joiningPlayers.push(newPlayer);
    },
    handleDisconnect: function(p) {
        console.log('Player disconnected: ' + p.username);
        room.joiningPlayers.forEach(function(e, i) {
            if(e.id == p.id) {
                room.joiningPlayers.splice(i, 1);
            }
        });
        room.players.forEach(function(e, i) {
            if(e.id == p.id) {
                room.players.splice(i, 1);
            }
        });
        if(room.players.length + 1 < game.minimumPlayersPerRoom) {
            kuzzle.unsubscribe(roomIdPlayers);
            kuzzle.unsubscribe(roomIdGameUpdates);
            kuzzle.unsubscribe(roomIdRoom);
            var roomUpdateQuery = {
                _id: game.player.rid,
                connectedPlayers: 0
            };
            kuzzle.update('kf-rooms', roomUpdateQuery, function() {
                console.log('Updated connected player count for current room (' + room.players.length + ' players remaining)');
                kuzzle.delete('kf-users', game.player.id, function() {
                    console.log('All done!');
                    musicInit.stop();
                    game.stateTransition.to('not-enough-players');
                });
            });
        }
    },
    quitGame: function() {
        console.log('Disconnecting..');
        kuzzle.unsubscribe(roomIdPlayers);
        kuzzle.unsubscribe(roomIdGameUpdates);
        kuzzle.unsubscribe(roomIdRoom);
        var roomUpdateQuery = {
            _id: game.player.rid,
            connectedPlayers: room.players.length
        };
        if(game.player.isMaster && room.players.length > 0) {
            console.log('You were master, now electing a new master');
            roomUpdateQuery.master = room.players[0].id;
        }
        kuzzle.update('kf-rooms', roomUpdateQuery, function() {
            console.log('Updated connected player count for current room (' + room.players.length + ' players remaining)');
            kuzzle.delete('kf-users', game.player.id, function() {
                console.log('All done!');
                musicInit.stop();
                game.state.start('main-menu', true, false);
            });
        });
    },
    update: function() {
        if(game.time.now > tellThatImConnectedTimer) {
            tellThatImConnectedTimer = game.time.now + tellThatImConnected;
            kuzzle.update('kf-users', {_id: game.player.id, kflastconnected: game.time.now});
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
                                kuzzle.delete('kf-users', p.id);
                                if(roomMasterId == p.id) {
                                    game.player.isMaster = true;
                                    console.log('You are now the new master of the room');
                                    console.log('Generating rules..');
                                    room.params = self.generateRoundRules();
                                    var updateQuery = {
                                        _id: game.player.rid,
                                        rid: game.player.rid,
                                        params: room.params,
                                        roundReady: true,
                                        showWinner: false,
                                        ending: null,
                                        masterId: game.player.id
                                    };
                                    if(room.params.rules.id == 'TM') {
                                        self.shufflePlayers(room.players);
                                        var blueTeam = [];
                                        var redTeam = [];
                                        room.players.forEach(function(p, i) {
                                            if(i % 2 === 0)
                                                blueTeam.push(p.id);
                                            else
                                                redTeam.push(p.id)
                                        });
                                        var teams = {
                                            red: redTeam,
                                            blue: blueTeam
                                        };
                                        room.params.teams = teams;
                                    }
                                    room.joiningPlayers.forEach(function(p) {
                                        room.players.push(p);
                                    });
                                    setTimeout(function() {
                                        kuzzle.update('kf-rooms', updateQuery, function () {
                                            console.log('Pushed new game round rules to other players');
                                        });
                                    }, 2000);
                                }
                            }
                        });
                    }
                });
            });
        }
    }
};
