var live = false;
function GameEndState() {}
GameEndState.prototype = {
    init: function (initData) {
        self = this;
        roundEndData = initData;
    },
    create: function() {
        game.stage.backgroundColor = 0xFFFFFF;

        w = null;
        iWon = false;
        switch(room.params.rules.id) {
            case 'FFA':
                if (room.ending.winners == game.player.id) {
                    w = game.player.username;
                    iWon = true;
                } else {
                    w = getPlayerById(room.ending.winners);
                    w = w.username;
                }
                break;
        }
        console.log('Match over. Winner: ' + w);

        var style = {font: "24px Helvetica", fill: 0x000000, align: "center"};

        winner = game.add.text(50, 100, 'Test', style);
        winner.alpha = 0.0;

        if(game.player.isMaster) {
            console.log('Clearing rules & ending for current room..');
            //setTimeout(function() {
                var updateQuery = {
                    _id: game.player.rid,
                    roundReady: false,
                    showWinner: true
                };
                kuzzle.update('kf-rooms', updateQuery, function() {
                    console.log('Cleared game round rules and ending');
                    //setTimeout(function() {
                        initData = {
                            player: game.player,
                            players: room.players
                        };
                        game.stateTransition.to('game-init', true, false, initData);
                    //}, 5000);
                });
            //}, 5000);
        }
    },
    showWinner: function() {
        room.params = null;
        room.ending = null;
        if(iWon) {
            winner.text = 'Congratulations, you won!';
        } else {
            winner.text = 'The winner is: ' + w;
        }
        game.add.tween(winner.scale).to({x: 2.0, y: 2.0}, 1000, 'Bounce').delay(200).start();
        game.add.tween(winner).to({alpha: 1.0}, 500, 'Linear').delay(200).start();

        //setTimeout(function() {
            initData = {
                player: game.player,
                players: room.players
            };
            game.stateTransition.to('game-init', true, false, initData);
        //}, 5000);
    }
};