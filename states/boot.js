function BootState() {}
BootState.prototype = {
    preload: function() {
    },
    create: function() {

        this.game.hasMusic = true;

        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
        this.game.isFullScreen = false;

        this.game.minimumPlayersPerRoom = 2;
        this.game.maximumPlayersPerRoom = 8;

        tellThatImConnected = 2000;
        tellThatImConnectedTimer = 0;
        checkThatPlayersAreAlive = 6000;
        checkThatPlayersAreAliveTimer = 0;

        // Change Kuzzle API URL here:
        this.game.kuzzleUrl = 'http://api.uat.kuzzle.io:7512';

        /*this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.forceOrientation(true);*/

        this.stage.disableVisibilityChange = true;

        this.game.state.start('preload');
    }
};