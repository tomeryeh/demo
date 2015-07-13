function BootState() {}
BootState.prototype = {
    preload: function() {
        // load preloader assets
    },
    create: function() {
        // setup game environment
        // scale, input etc..

        this.game.hasMusic = false;

        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
        this.game.isFullScreen = false;

        this.game.kuzzleUrl = 'http://localhost:8081';
        //this.game.kuzzleUrl = 'http://api.uat.kuzzle.io:7512';

        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.forceOrientation(true);

        this.stage.disableVisibilityChange = true;

        this.game.state.start('preload');
    }
};