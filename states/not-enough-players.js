function NotEnoughPlayersState() {}
NotEnoughPlayersState.prototype = {
    init: function(initData) {
        this.initData = initData;
    },
    preload: function() {
    },
    create: function() {
        game.backgroundColor = 0x000000;
        var style = {font: "24px Helvetica", fill: 0xFFFFFF, align: "center"};
        var notEnoughPlayers = game.add.text(50, 100, 'Not enough players\nleft in the room\nDisconnecting..', style);
        setTimeout(function() {
            game.stateTransition.to('main-menu');
        }, 4000);
    },
    update: function() {
    }
};
