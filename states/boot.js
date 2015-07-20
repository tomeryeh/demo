function BootState() {}
BootState.prototype = {
    preload: function() {
        // load preloader assets
    },
    create: function() {
        // setup game environment
        // scale, input etc..

        //this.game.plugins.add(Phaser.Plugin.SaveCPU);

        this.game.hasMusic = false;

        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
        this.game.isFullScreen = false;

        this.game.minimumPlayersPerRoom = 2;
        this.game.maximumPlayersPerRoom = 8;

        //this.game.kuzzleUrl = 'http://localhost:7512';
        //this.game.kuzzleUrl = 'http://192.168.0.24:7512';
        this.game.kuzzleUrl = 'http://api.uat.kuzzle.io:7512';

        /*this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.forceOrientation(true);*/

        this.stage.disableVisibilityChange = true;

        this.game.state.start('preload');
    }
};