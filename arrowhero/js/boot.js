var boot = function(game) {
  console.log("%cStarting game", "color:white; background:red");
};

boot.prototype = {
  preload: function() {
    this.game.load.image('loading', 'assets/images/loading.png');
  },
  create: function() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    //this.scale.setScreenSize();

    this.game.load.onLoadStart.add(this.loadStart, this);
    this.game.load.onFileComplete.add(this.fileComplete, this);
    this.game.load.onLoadComplete.add(this.loadComplete, this);
    this.game.load.start();

    this.game.state.start('preload');
  },

  loadStart: function() {
    //console.log('Loading is started');
  },

  fileComplete: function(progress, cacheKey, success, totalLoaded, totalFiles) {
    //console.log('File loaded');
  },

  loadComplete: function() {
    //console.log('Load complete');
  }
};
