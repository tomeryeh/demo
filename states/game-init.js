var live = false;
function GameInitState() {}
GameInitState.prototype = {
    init: function (initData) {
        self = this;
        roundData = initData;
    },
    create: function() {
        musicInit = this.game.add.audio('music-game');
        if(this.game.hasMusic) musicInit.play();

        room.params = null;

        game.stage.backgroundColor = 0xFFFFFF;

        room.params = null;
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

        var style = {font: "24px Helvetica", fill: 0x000000, align: "center"};

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
        if(room.players.length >= 2) {
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
    }
};