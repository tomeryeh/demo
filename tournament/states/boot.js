function BootState() {}
BootState.prototype = {
    preload: function() {
    },
    create: function() {
      this.game.kuzzleUrl = Configuration.kuzzleUrl;
      this.game.hasMusic = Configuration.music;
      this.game.isFullScreen = Configuration.fullscreen;

      this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

      this.game.minimumPlayersPerRoom = 2;
      this.game.maximumPlayersPerRoom = 8;

      tellThatImConnected = 2000;
      tellThatImConnectedTimer = 0;
      checkThatPlayersAreAlive = 6000;
      checkThatPlayersAreAliveTimer = 0;

      this.stage.disableVisibilityChange = true;

      this.game.state.start('preload');
    }
};
