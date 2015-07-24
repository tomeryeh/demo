var live = false;
function GameEndState() {}
GameEndState.prototype = {
    init: function (initData) {
        self = this;
        roundEndData = initData;
    },
    create: function() {
        musicInit = this.game.add.audio('music-game');
        if(this.game.hasMusic) musicInit.play();

        game.stage.backgroundColor = 0x000000;

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
            case 'TM':
                if(room.ending.winners == 'blue') {
                    w = 'blue team';
                }
                if(room.ending.winners == 'red') {
                    w = 'red team';
                }
                if(room.ending.winners == currentTeam) {
                    iWon = true;
                }
                break;
        }
        console.log('Match over. Winner: ' + w);

        var color = Phaser.Color.getWebRGB(0xFFFFFF);
        var style = {font: "24px Helvetica", fill: color, align: "center"};

        winner = game.add.text(50, 100, 'Test', style);
        winner.alpha = 0.0;

        if(game.player.isMaster) {
            console.log('Clearing rules & ending for current room..');
            setTimeout(function() {
                var updateQuery = {
                    _id: game.player.rid,
                    roundReady: false,
                    showWinner: true
                };
                kuzzle.update('kf-rooms', updateQuery, function() {
                    console.log('Cleared game round rules and ending');
                    /*setTimeout(function() {
                        initData = {
                            player: game.player,
                            players: room.players
                        };
                        game.stateTransition.to('game-init', true, false, initData);
                    }, 2000);*/
                });
            }, 2000);
        }
    },
    showWinner: function() {
        switch(room.params.rules.id) {
            case 'FFA':
                if(iWon) {
                    winner.text = 'Congratulations!\nYou won!';
                } else {
                    winner.text = 'The winner is ' + w;
                }
                break;
            case 'TM':
                if(iWon) {
                    winner.text = 'Congratulations!\nYour team won!';
                } else {
                    winner.text = 'The winner team\nis: ' + w;
                }
                break;
        }
        room.params = null;
        room.ending = null;
        game.add.tween(winner.scale).to({x: 2.0, y: 2.0}, 1000, 'Bounce').delay(200).start();
        game.add.tween(winner).to({alpha: 1.0}, 500, 'Linear').delay(200).start();

        setTimeout(function() {
            initData = {
                player: game.player,
                players: room.players
            };
            musicInit.stop();
            game.stateTransition.to('game-init', true, false, initData);
        }, 2000);
    }
};