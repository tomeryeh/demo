KuzzleGame.Level = {

  debug: false,
  arrowsMatrix: [],
  ARROW_LEFT: 1,
  ARROW_DOWN: 2,
  ARROW_UP: 3,
  ARROW_RIGHT: 4,
  EMPTY_ARROW: 0,
  elementToGeneratePerLevel: 200,
  arrowsProbability: [0.6, 0.1, 0.1, 0.1, 0.1],

  /**
   * generate Level data (bi-dimentionnal array of arrows)
   */
  generateLevel: function() {
    KuzzleGame.MusicManager.currentMusic.music.play();
    KuzzleGame.MusicManager.currentMusic.music.stop();

    var musicDuration = KuzzleGame.MusicManager.currentMusic.music.totalDuration;
    var bpm = KuzzleGame.MusicManager.currentMusic.bpm;
    var bps = bpm / 60;

    this.elementToGeneratePerLevel = Math.floor(bps * musicDuration);

    for (var generatingIndex = 0; generatingIndex < this.elementToGeneratePerLevel; generatingIndex++) {
      this.arrowsMatrix.push(this.generateRandomData(this));
    }

    if (this.debug) {
      console.log(this.arrowsMatrix);
    }
  },

  generateRandomData: function() {
    var r = Math.random();
    var s = 0;

    for (var i = 0; i < this.arrowsProbability.length; i++) {
      s += this.arrowsProbability[i];
      if (r <= s)
        return i;
    }
  }

};
