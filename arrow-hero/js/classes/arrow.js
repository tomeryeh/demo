KuzzleGame.Arrow = {
  game: null,
  arrows: null,
  distanceBetweenArrows: 100,

  init: function(game) {
    this.game = game;
    this.generateBottomArrows();
  },

  generateBottomArrows: function() {
    for (var i = 0; i < 4; i++) {
      var bottomArrow = this.game.add.sprite((i + 1) * 100 + 10, KuzzleGame.HitZone.hitZoneY + KuzzleGame.HitZone.hitZoneHeight / 2, 'arrows', 38 + i);
      bottomArrow.anchor.set(0.5, 0.5);
    }
  },

  generateArrows: function() {
    this.arrows.enableBody = true;
    this.arrows.physicsBodyType = Phaser.Physics.ARCADE;

    //var bps = KuzzleGame.MusicManager.currentMusic.bpm / 60;
    //build arrows array
    for (var i = 0; i < KuzzleGame.Level.arrowsMatrix.length; i++) {
      var arrowType = KuzzleGame.Level.arrowsMatrix[i];
      if (arrowType != 0) {
        var spriteOffset = 0;
        if (arrowType == KuzzleGame.Level.ARROW_RIGHT) {
          spriteOffset = 7;
        }
        if (arrowType == KuzzleGame.Level.ARROW_DOWN) {
          spriteOffset = 18;
        }
        if (arrowType == KuzzleGame.Level.ARROW_UP) {
          spriteOffset = 23;
        }

        var arrow = this.arrows.create(arrowType * 100 + 10, 0 - (i * this.distanceBetweenArrows), 'arrows', spriteOffset);

        arrow.y -= arrow.height / 2;
        arrow.name = 'arrow' + i;
        arrow.type = arrowType;
        arrow.isAlreadyHit = false;
        arrow.checkWorldBounds = true;
        arrow.events.onOutOfBounds.add(this.outOfBounds, this);
        arrow.body.velocity.y = 0;
        arrow.anchor.set(0.5, 0.5);
        if (arrowType === KuzzleGame.Level.ARROW_LEFT) {
          arrow.reversedType = KuzzleGame.Level.ARROW_RIGHT;
        } else if (arrowType === KuzzleGame.Level.ARROW_RIGHT) {
          arrow.reversedType = KuzzleGame.Level.ARROW_LEFT;
        } else if (arrowType === KuzzleGame.Level.ARROW_UP) {
          arrow.reversedType = KuzzleGame.Level.ARROW_DOWN;
        } else if (arrowType === KuzzleGame.Level.ARROW_DOWN) {
          arrow.reversedType = KuzzleGame.Level.ARROW_UP;
        }
      }
    }

    KuzzleGame.Spell.generateSpell();
  },

  hit: function(sprite) {
    this.game.add.tween(sprite.scale).to({
      x: 2,
      y: 2
    }, 200, Phaser.Easing.Bounce.Out, true);
  },

  miss: function(sprite) {
    sprite.visible = false;
    var explosion = this.game.add.sprite(sprite.x, sprite.y, 'explosion');
    var animation = explosion.animations.add('explosion');
    animation.onLoop.add(this.onExplosionLooped, this);
    animation.play(75, true);
  },

  onExplosionLooped: function(sprite, animation) {
    sprite.destroy();
  },

  outOfBounds: function(arrow) {
    if (arrow.y > this.game.height) {
      arrow.destroy();
    }
  },

  startArrows: function() {
    //console.log(this.distanceBetweenArrows, 1 / (KuzzleGame.MusicManager.currentMusic.bpm / 60), this.distanceBetweenArrows / (1 / (KuzzleGame.MusicManager.currentMusic.bpm / 60)));
    this.arrows.setAll('body.velocity.y', this.distanceBetweenArrows * (KuzzleGame.MusicManager.currentMusic.bpm / 60));
  }
};
