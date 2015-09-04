KuzzleGame.ScoreBar = {
  game: null,

  progressBarContour: null,
  progressBar: null,

  progressBarMaxWidth: null,
  lastProgression: 0,

  init: function(game) {
    this.game = game;
    this.lastProgression = 0;
    this.createProgressBars();
  },

  createProgressBars: function() {
    this.progressBarContour = this.game.add.graphics(KuzzleGame.Text.bonusText.x + KuzzleGame.Text.bonusText.width, KuzzleGame.Text.bonusText.y);
    this.progressBarContour.lineStyle(4, 0xFFFFFF, 1);
    this.progressBarContour.drawRect(0, 0, 100, 28);

    this.progressBar = this.game.add.graphics(this.progressBarContour.x + 2, this.progressBarContour.y + this.progressBarContour.height / 2 - 2);
    this.progressBar.lineStyle(24, 0xE6ED1F, 1);
    this.progressBar.lineTo(1, 0);
    this.progressBar.scale.x = 0;

    this.progressBarMaxWidth = this.progressBarContour.width - 8;
  },

  updateProgressBar: function() {
    var progression = Phaser.Math.floor((KuzzleGame.Player.score - KuzzleGame.Spell.lastLaunchedSpellScore) / KuzzleGame.Spell.scoreToNextSpell * 100);
    progression = Phaser.Math.floor(progression / this.progressBarMaxWidth * 100);
    if (progression >= 100) {
      progression = 100;

      //console.log(KuzzleGame.KuzzleManager.connexionEstablished && KuzzleGame.Player.score - KuzzleGame.Spell.lastLaunchedSpellScore < KuzzleGame.Spell.scoreToNextSpell);
      //console.log(this.lastProgression, KuzzleGame.KuzzleManager.connexionEstablished, KuzzleGame.Player.score -  KuzzleGame.Spell.lastLaunchedSpellScore,KuzzleGame.Spell.scoreToNextSpell);

      if (KuzzleGame.KuzzleManager.connexionEstablished && (KuzzleGame.Player.score - KuzzleGame.Spell.lastLaunchedSpellScore >= KuzzleGame.Spell.scoreToNextSpell)) {
        KuzzleGame.Text.displayPressSpaceBar();

        if (this.lastProgression <= 100 && KuzzleGame.SoundEffect.NewBonusPlayed == false) {
          KuzzleGame.SoundEffect.newBonus();
          KuzzleGame.SoundEffect.NewBonusPlayed = true;
        }
      }
    }
    this.progressBar.scale.x = progression;
    this.lastProgression = progression;

    if (this.lastProgression < 10) {
      KuzzleGame.SoundEffect.NewBonusPlayed = false;
    }
  }
};
