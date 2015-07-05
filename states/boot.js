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

        this.stage.disableVisibilityChange = true;

        this.game.state.start('preload');
    }
};