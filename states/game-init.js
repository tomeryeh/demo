var live = false;
function GameInitState() {}
GameInitState.prototype = {
    init: function (initData) {
        self = this;
        game.player = {
            "username": "Sam-" + Math.floor((Math.random() * 1000) + 1),
            "color"   : Phaser.Color.getRandomColor(30, 220),
            "hp"      : 50
        };
        initPlayers = [];
        kuzzle = new Kuzzle(this.game.kuzzleUrl);
        kuzzle.create('kf-users', game.player, true, function (createData) {
            game.player.id = createData.result._id;
            /*kuzzle.create('kf-room-1', {pid: game.player.id}, false, function (updateData) {
                game.player.updateId = updateData.result._id;*/
                var filters = {
                    "filter": {
                        "exists": {
                            "field": "username"
                        }
                    }
                };
                kuzzle.search('kf-users', filters, function (response) {
                    response.result.hits.hits.forEach(function (e) {
                        if (e._id != game.player.id) {
                            initPlayers.push({id: e._id, body: e._source});
                        }
                    });
                    live = true;
                });
            //});
        });
    },
    create: function() {
        self.checkForStart();
    },
    checkForStart: function() {
        setTimeout(function () {
            if(!live) {
                self.checkForStart();
            }
            else {
                initData = {
                    player: game.player,
                    players: initPlayers
                };
                game.stateTransition.to('game-round-no-monster', true, false, initData);
            }
        }, 1000);
    },
};