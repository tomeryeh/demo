KuzzleGame.Player = {
  game: null,
  name: 'player 1',
  score: 0,
  combo: 0,
  isBlocked: false,
  blockedTimestamp: 0,
  isReversed: false,
  reversedTimestamp: 0,
  opponentScore: 0,
  hurtLines: null,
  hurtLineTween: null,

  init: function(game) {
    this.game = game;
    this.score = 0;
    this.combo = 0;
    this.isBlocked = false;
    this.blockedTimestamp = 0;
    this.isReversed = false;
    this.reversedTimestamp = 0;
    this.opponentScore = 0;
    this.hurtLines = null;
    this.hurtLineTween = null;

    this.createHurtLines();
  },

  hit: function(hitText) {
    this.combo++;
    this.score += this.combo;
    KuzzleGame.SoundEffect.hit();
    KuzzleGame.ScoreBar.updateProgressBar();
    KuzzleGame.Text.displayScore();
    KuzzleGame.Text.displayHitText(hitText);
    KuzzleGame.KuzzleManager.throwEvent('OPPONENT_SCORE', this.score);
  },

  miss: function() {
    this.combo = 0;
    KuzzleGame.SoundEffect.miss();
    KuzzleGame.Text.displayCombo();

    if (this.hurtLineTween === null) {
      this.hurtLineTween = this.game.add.tween(this.hurtLines).to({
        alpha: 1
      }, 200, Phaser.Easing.Linear.None, true, 0, 0);
      this.hurtLineTween.yoyo(true, 0);
      this.hurtLineTween.onComplete.add(function() {
        this.hurtLineTween = null;
      }, this);
    }
  },

  createHurtLines: function() {
    this.hurtLines = this.game.add.graphics(0, 0);
    this.hurtLines.lineStyle(30, 0xCF152A, 1);
    this.hurtLines.drawRect(0, 0, this.game.width, this.game.height);
    this.hurtLines.alpha = 0;
  }
};
