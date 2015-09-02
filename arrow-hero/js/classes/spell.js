KuzzleGame.Spell = {
  game: null,

  SPELL_PACMAN: 1,
  SPELL_KIRBY: 2,
  SPELL_REVERSE: 3,
  SPELL_BLOCK: 4,

  scoreToNextSpell: 0,
  lastLaunchedSpellScore: 0,

  blockedTime: 5000,
  reverseTime: 6000,
  kirbyBlowingTime: 4000, //@Antho : Geary streeeeeeeeeeeet !

  pacman: null,
  kirbyBlowingHitZone: null,

  init: function(game) {
    this.game = game;

    this.scoreToNextSpell = 0;
    this.lastLaunchedSpellScore = 0;
  },

  generateSpell: function() {
    //count maximum score
    var scoreMax = this.fibonacci(KuzzleGame.Arrow.arrows.length, 0, 1);
    this.scoreToNextSpell = Phaser.Math.floor(scoreMax / 50);
  },

  fibonacci: function(length, total, index) {
    total = total + index;
    if (index < length) {
      total = this.fibonacci(length, total, ++index);
    }

    return total;
  },

  sendSpell: function() {
    if (KuzzleGame.Player.score - this.lastLaunchedSpellScore < this.scoreToNextSpell) {
      KuzzleGame.SoundEffect.notEnoughScore();
    } else {
      KuzzleGame.SoundEffect.sendSpell();
      var randomSpell = Math.floor(Math.random() * 4 + 1);
      KuzzleGame.KuzzleManager.throwEvent('SEND_SPELL', randomSpell);
      this.lastLaunchedSpellScore = KuzzleGame.Player.score;
      KuzzleGame.Text.displayPressSpaceBar(true);
    }
  },

  receiveSpell: function(spellType) {
    if (spellType === this.SPELL_KIRBY) {
      this.spellKirby();
    } else if (spellType === this.SPELL_REVERSE) {
      this.spellReverse();
      KuzzleGame.SoundEffect.receiveSpell();
    } else if (spellType === this.SPELL_PACMAN) {
      this.spellPacman();
    } else if (spellType === this.SPELL_BLOCK) {
      this.spellBlock();
      KuzzleGame.SoundEffect.receiveSpell();
    }
  },

  randomSpell: function() {
    var random = Math.random() * (100 - 1) + 1;
    if (random < 3) {
      var spellRand = Math.floor(Math.random() * (4 - 1) + 1);

      if (spellRand == 1) {
        this.spellKirby();
      } else if (spellRand == 2) {
        this.spellReverse();
        KuzzleGame.SoundEffect.receiveSpell();
      } else if (spellRand == 3) {
        this.spellPacman();
      } else if (spellRand == 4) {
        this.spellBlock();
        KuzzleGame.SoundEffect.receiveSpell();
      }
    }
  },

  spellKirby: function() {
    var kirby = this.game.add.sprite(this.game.width, this.game.world.centerY, 'kirby', 49);
    kirby.anchor.set(0.5, 0.5);
    kirby.scale.set(1.5, 1.5);
    this.game.physics.enable(kirby, Phaser.Physics.ARCADE);
    kirby.animations.add('walk', [9, 10, 11, 12, 13]).play(9, true);
    var tweenMoveLeft = this.game.add.tween(kirby).to({
      x: 600,
      y: kirby.y
    }, 3000, Phaser.Easing.Linear.None, true);
    tweenMoveLeft.onComplete.add(function(kirby) {
      this.kirbyBlowingHitZone = this.game.add.sprite(0, kirby.y, null);
      this.kirbyBlowingHitZone.width = kirby.x;
      this.kirbyBlowingHitZone.height = 200;
      this.kirbyBlowingHitZone.anchor.set(0, 0.5);
      this.game.physics.enable(this.kirbyBlowingHitZone, Phaser.Physics.ARCADE);

      kirby.animations.add('blow', [49, 48]).play(5, false);
      this.game.time.events.add(this.kirbyBlowingTime, function() {
        this.kirbyBlowingHitZone.destroy();
        kirby.scale.set(-1.5, 1.5);
        kirby.animations.getAnimation('walk').play(9, true);
        var tweenMoveRight = this.game.add.tween(kirby).to({
          x: this.game.width,
          y: kirby.y
        }, 3000, Phaser.Easing.Linear.None, true);
        tweenMoveRight.onComplete.add(function(kirby) {
          kirby.destroy();
        }, this);
      }, this);
    }, this);
  },

  onKirbyBlowingHitZoneOverlap: function(hitZone, arrow) {
    if (!arrow.isAlreadyHit) {
      KuzzleGame.Player.miss();
      arrow.isAlreadyHit = true;
      arrow.body.velocity.y = 0;
      this.game.add.tween(arrow).to({
        x: hitZone.x + hitZone.width,
        y: hitZone.y
      }, 400, Phaser.Easing.Linear.None, true, 0, true);
      this.game.add.tween(arrow).to({
        angle: 359
      }, 400, Phaser.Easing.Linear.None, true, 0, true);
      this.game.add.tween(arrow.scale).to({
        x: 0,
        y: 0
      }, 400, Phaser.Easing.Linear.None, true);
    }
  },

  spellReverse: function() {
    KuzzleGame.Player.isReversed = true;
    KuzzleGame.Player.reversedTimestamp = this.game.time.time;
    KuzzleGame.Text.displayReverse();
  },

  unReverse: function() {
    if ((this.game.time.time - KuzzleGame.Player.reversedTimestamp) > this.reverseTime) {
      KuzzleGame.Player.isReversed = false;
      KuzzleGame.Text.displayReverse(true);
    }
  },

  spellPacman: function() {
    this.pacman = this.game.add.sprite(0, this.game.height / 2, 'pacman');
    this.pacman.scale.set(2, 2);
    this.game.physics.enable(this.pacman, Phaser.Physics.ARCADE);
    this.pacman.animations.add('move').play(20, true);
    KuzzleGame.SoundEffect.pacmanMove(false);

    var tween = this.game.add.tween(this.pacman).to({
      x: this.game.width,
      y: this.pacman.y
    }, 8000, Phaser.Easing.Linear.None, true);
    tween.onComplete.add(function(sprite) {
      KuzzleGame.SoundEffect.pacmanMove(true);
      sprite.destroy();
    }, this);
  },

  onPacmanOverlap: function(pacman, arrow) {
    if (!arrow.isAlreadyHit) {
      KuzzleGame.Player.miss();
      arrow.isAlreadyHit = true;
      arrow.body.velocity.y = 0;
      this.game.add.tween(arrow).to({
        x: pacman.x + pacman.width,
        y: (pacman.y + pacman.height)
      }, 400, Phaser.Easing.Linear.None, true, 0, true);
      this.game.add.tween(arrow).to({
        angle: 359
      }, 400, Phaser.Easing.Linear.None, true, 0, true);
      this.game.add.tween(arrow.scale).to({
        x: 0,
        y: 0
      }, 400, Phaser.Easing.Linear.None, true);
      KuzzleGame.SoundEffect.pacmanEat();
    }
  },

  spellBlock: function() {
    KuzzleGame.Player.isBlocked = true;
    KuzzleGame.Player.blockedTimestamp = this.game.time.time;
    KuzzleGame.Text.displayBlocking();
  },

  unBlock: function() {
    if ((this.game.time.time - KuzzleGame.Player.blockedTimestamp) > this.blockedTime) {
      KuzzleGame.Player.isBlocked = false;
      KuzzleGame.Text.displayBlocking(true);
    }
  }
};
