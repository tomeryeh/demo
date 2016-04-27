/**
 * Copyright © 15/07/2015, OSTALOWSKI Bastien, POIRET Laurent

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 The Software is provided “as is”, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders X be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the Software.

 Except as contained in this notice, the name of OSTALOWSKI Bastien and POIRET Laurent shall not be used in advertising or otherwise to promote the sale, use or other dealings in this Software without prior written authorization from OSTALOWSKI Bastien and POIRET Laurent.
 */

/**
 * @param game
 * @constructor
 */
var KuzzleGame = function(game) {};

KuzzleGame.prototype = {
  isGameStarted: false,
  countDownTimer: null,
  countDown: 0,

  /**
   * Load your assets here. This is the first function launched
   */
  preload: function() {
    KuzzleGame.MusicManager.init();
    KuzzleGame.MusicManager.loadMusic(this.game);
  },

  /**
   * Initialize your variables here
   */
  create: function() {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    //  We only want world bounds on the left and right
    this.game.physics.setBoundsToWorld();
    this.game.time.desiredFps = 60;
    this.game.stage.disableVisibilityChange = true;

    KuzzleGame.Background.create(this.game, 'game');
    KuzzleGame.SoundEffect.init(this.game);
    KuzzleGame.MusicManager.currentMusic.music = this.game.add.audio(KuzzleGame.MusicManager.currentMusic.identifier);

    KuzzleGame.Player.init(this.game);
    KuzzleGame.HitZone.init(this.game);
    KuzzleGame.Arrow.init(this.game);
    KuzzleGame.Arrow.arrows = this.game.add.group();
    KuzzleGame.Keyboard.init(this.game, KuzzleGame.Arrow.arrows, this);
    KuzzleGame.Spell.init(this.game);
    KuzzleGame.Text.init(this.game);
    KuzzleGame.ScoreBar.init(this.game);
    KuzzleGame.Text.displayScore();

    KuzzleGame.KuzzleManager.init(this);
    this.waitForPlayer();
  },

  /**
   * Update your variables here. Typically, used for update your sprites coordinates (a loop is automaticaly launched by phaser)
   */
  update: function() {
    KuzzleGame.Background.update();

    if (KuzzleGame.Arrow.arrows !== null && this.isGameStarted) {
      var arrowLeft = 0;
      for (var i = 0; i < KuzzleGame.Arrow.arrows.length; i++) {
        if (!KuzzleGame.Arrow.arrows.children[i].isAlreadyHit) {
          arrowLeft++;
        }
        if (KuzzleGame.Arrow.arrows.children[i].y > (KuzzleGame.HitZone.hitZoneY + KuzzleGame.HitZone.hitZoneHeight) && KuzzleGame.Arrow.arrows.children[i].isAlreadyHit === false) {
          KuzzleGame.Arrow.arrows.children[i].isAlreadyHit = true;
          KuzzleGame.Player.miss();
          KuzzleGame.Arrow.miss(KuzzleGame.Arrow.arrows.children[i]);
        }
      }
      if (arrowLeft === 0 && !KuzzleGame.MusicManager.currentMusic.music.isPlaying) {
        this.isGameStarted = false;
        this.game.time.events.add(Phaser.Timer.SECOND * 3, this.gameOver, this);
      }
    }

    if (KuzzleGame.Player.isBlocked) {
      KuzzleGame.Spell.unBlock();
    }

    if (KuzzleGame.Player.isReversed) {
      KuzzleGame.Spell.unReverse();
    }

    if (KuzzleGame.Spell.pacman !== null && KuzzleGame.Arrow.arrows !== null) {
      this.game.physics.arcade.overlap(KuzzleGame.Spell.pacman, KuzzleGame.Arrow.arrows, KuzzleGame.Spell.onPacmanOverlap, null, KuzzleGame.Spell);
    }

    if (KuzzleGame.Spell.kirbyBlowingHitZone !== null && typeof KuzzleGame.Arrow.arrows !== null) {
      this.game.physics.arcade.overlap(KuzzleGame.Spell.kirbyBlowingHitZone, KuzzleGame.Arrow.arrows, KuzzleGame.Spell.onKirbyBlowingHitZoneOverlap, null, KuzzleGame.Spell);
    }
  },

  /**
   * Update your render here (Typically used for text, sounds, display)
   */
  render: function() {
    //this.game.debug.text(this.game.time.suggestedFps, 32, 32);
  },

  start: function() {

    if (this.isGameStarted === false) {
      if (KuzzleGame.KuzzleManager.connexionEstablished === false) {
        KuzzleGame.Text.opponentScore.destroy();
        KuzzleGame.Text.bonusText.destroy();
        KuzzleGame.ScoreBar.progressBar.destroy();
        KuzzleGame.ScoreBar.progressBarContour.destroy();
      }
      KuzzleGame.MusicManager.currentMusic.music.play();
      KuzzleGame.Arrow.startArrows();
      this.isGameStarted = true;
    }
  },

  stop: function() {
    this.isGameStarted = false;
    KuzzleGame.Level.arrowsMatrix = [];
    KuzzleGame.Arrow.arrows = null;
    if (KuzzleGame.MusicManager.currentMusic.music && KuzzleGame.MusicManager.currentMusic.music.isPlaying) {
      KuzzleGame.MusicManager.currentMusic.music.stop();
    }
    this.game.state.start("kuzzlegame");
  },

  generateLevel: function() {
    if (KuzzleGame.KuzzleManager.isHost || !KuzzleGame.KuzzleManager.connexionEstablished) {
      KuzzleGame.Level.generateLevel();
      KuzzleGame.Arrow.generateArrows();
      if (KuzzleGame.KuzzleManager.connexionEstablished) {
        KuzzleGame.KuzzleManager.throwEvent('LEVEL_GENERATION', KuzzleGame.Level.arrowsMatrix);
      }
    }
  },

  waitForPlayer: function() {
    KuzzleGame.Text.displayWaitForPlayer();
  },

  startGameCountDown: function() {
    KuzzleGame.Text.displayWaitForPlayer(true);
    this.countDown = 3;
    KuzzleGame.Text.displayStartGameCountDown(this.countDown);
    this.countDownTimer = this.game.time.create(false);
    this.countDownTimer.loop(Phaser.Timer.SECOND, this.updateCountDownTimer, this);
    this.countDownTimer.start();
  },

  updateCountDownTimer: function() {
    if (--this.countDown === 0) {
      KuzzleGame.Text.displayStartGameCountDown(this.countDown, true);
      this.countDownTimer.stop();
      this.start();
    } else {
      KuzzleGame.Text.displayStartGameCountDown(this.countDown);
    }
  },

  gameOver: function() {
    KuzzleGame.KuzzleManager.hostUnregister();
    KuzzleGame.SoundEffect.pacmanMove(true);
    if (KuzzleGame.MusicManager.currentMusic.music && KuzzleGame.MusicManager.currentMusic.music.isPlaying) {
      KuzzleGame.MusicManager.currentMusic.music.stop();
    }
    this.game.state.start("gameover");
  },

  togglePause: function() {
    this.game.paused = !this.game.paused;
    KuzzleGame.Text.displayPause(!this.game.paused);
    if (this.game.paused) {
      if (KuzzleGame.MusicManager.currentMusic.music.isPlaying) {
        KuzzleGame.MusicManager.currentMusic.music.pause();
      }
    } else {
      if (KuzzleGame.MusicManager.currentMusic.music.paused) {
        KuzzleGame.MusicManager.currentMusic.music.resume();
      }
    }
  }
};
