function NotEnoughPlayersState() {}
NotEnoughPlayersState.prototype = {
    init: function(initData) {
        this.initData = initData;
    },
    preload: function() {
        game.load.image('not-enough-players-left', 'assets/sprites/not-enough-players-left.png');
    },
    create: function() {
        game.stage.backgroundColor = 0x000000;
        var notEnoughPlayers = game.add.sprite(100, 60, 'not-enough-players-left');
        notEnoughPlayers.alpha = 0.0;
        notEnoughPlayers.scale.set(0.0, 0.0);
        //notEnoughPlayers.anchor.setTo(0.5, 0.5);
        game.add.tween(notEnoughPlayers.scale).to({x: 1.2, y: 1.2}, 1000, Phaser.Easing.Bounce.Out, true);
        game.add.tween(notEnoughPlayers).to({angle: 1080}, 1000, Phaser.Easing.Elastic.Out, true);
        game.add.tween(notEnoughPlayers).to({alpha: 1.0}, 1000, Phaser.Easing.Exponential.Out, true);
        setTimeout(function() {
            game.stateTransition.to('main-menu');
        }, 4000);
    },
    update: function() {
    }
};
