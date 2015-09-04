KuzzleGame.SoundEffect = {
  game: null,

  hitSoundEffect: null,
  missSoundEffect: null,
  notEnoughScoreEffect: null,
  pacmanMoveEffect: null,
  pacmanEatEffect: null,
  newBonusEffect: null,
  sendSpellEffect: null,
  receiveSpellEffect: null,
  NewBonusPlayed: false,

  init: function(game) {
    this.game = game;
    this.hitSoundEffect = this.game.add.audio('hit');
    this.missSoundEffect = this.game.add.audio('miss');
    this.pacmanMoveEffect = this.game.add.audio('pacman-move');
    this.pacmanEatEffect = this.game.add.audio('pacman-eat');
    this.newBonusEffect = this.game.add.audio('spell-bonus');
    this.sendSpellEffect = this.game.add.audio('send-spell');
    this.receiveSpellEffect = this.game.add.audio('receive-spell');
    this.notEnoughScoreEffect = this.game.add.audio('not-enough-score');

    //this.hitSoundEffect.volume = 0.4;
    //this.missSoundEffect.volume = 0.4;
    //this.pacmanMoveEffect.volume = 0.4;
    //this.pacmanEatEffect.volume = 0.4;
    //this.newBonusEffect.volume = 0.4;
    //this.sendSpellEffect.volume = 0.4;
    //this.receiveSpellEffect.volume = 0.4;
    //this.notEnoughScoreEffect.volume = 0.4;
  },

  hit: function() {
    this.hitSoundEffect.play();
  },

  miss: function() {
    this.missSoundEffect.play();
  },

  notEnoughScore: function() {
    this.notEnoughScoreEffect.play();
  },

  pacmanMove: function(stop) {
    if (!stop) {
      if (!this.pacmanMoveEffect.isPlaying) {
        this.pacmanMoveEffect.loopFull();
      }
    } else {
      this.pacmanMoveEffect.stop();
    }
  },

  pacmanEat: function() {
    this.pacmanEatEffect.play();
  },

  newBonus: function() {
    this.newBonusEffect.play();
  },

  sendSpell: function() {
    this.sendSpellEffect.play();
  },

  receiveSpell: function() {
    this.receiveSpellEffect.play();
  }
};
