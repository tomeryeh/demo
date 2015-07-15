var live = false;
function GameInitState() {}
GameInitState.prototype = {
    init: function (initData) {
        self = this;
        roundData = initData;
    },
    create: function() {
        room.params = null;

        game.stage.backgroundColor = 0xFFFFFF;

        room.params = null;
        if(game.player.isMaster) {
            console.log('Generating rules..');
            room.params = self.generateRoundRules();
            var updateQuery = {
                _id: game.player.rid,
                params: room.params,
                roundReady: true,
                showWinner: false,
                ending: null
            };
            setTimeout(function() {
                kuzzle.update('kf-rooms', updateQuery, function () {
                    console.log('Pushed new game round rules to other players');
                });
            }, 3000);
        } else {
            console.log('Waiting for round rules from Kuzzle..');
        }

        var style = {font: "24px Helvetica", fill: 0x000000, align: "center"};

        initRules = game.add.text(100, 100, 'Test', style);
        initRules.alpha = 0.0;

        initLevel = game.add.text(100, 100 + 100, 'Test', style);
        initLevel.alpha = 0.0;
    },
    generateRoundRules: function() {
        var modes = [
            {id: 'FFA', label: 'Free for all'},
            /*{id: 'TM', label: 'Team match'}*/
        ];
        var levels = [
            {id: 'CITY', label: 'City'},
            /*{id: 'KUZZLE', label: 'Kuzzle'}*/
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

        game.add.tween(initRules.scale).to({x: 2.0, y: 2.0}, 2000, 'Bounce').start();
        game.add.tween(initRules).to({alpha: 1.0}, 1000, 'Linear').start();

        var levelScaleIn = game.add.tween(initLevel.scale).to({x: 2.0, y: 2.0}, 2000, 'Bounce').delay(2000).start();
        game.add.tween(initLevel).to({alpha: 1.0}, 1000, 'Linear').delay(2000).start();

        levelScaleIn.onComplete.add(function() {
            setTimeout(function() {
                roundData.params = room.params;
                game.stateTransition.to('game-round-no-monster', true, false, roundData);
            }, 1000);
        }, this);
    }
};