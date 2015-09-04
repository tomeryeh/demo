function BootState() {}
BootState.prototype = {
    preload: function() {
    },
    create: function() {
      this.game.kuzzleUrl = Configuration.server.kuzzleUrl;
      this.game.hasMusic = Configuration.gameOptions.music;
      this.game.isFullScreen = Configuration.gameOptions.fullscreen;

      this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

      this.stage.disableVisibilityChange = true;

      this.game.state.start('preload');
    }
};
