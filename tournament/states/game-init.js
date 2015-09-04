var live = false;
function GameInitState() {}
GameInitState.prototype = {
  init: function () {
    self = this;
  },

  preload: function () {
    game.load.image('please-wait', 'assets/sprites/please-wait.png');
  },

  create: function () {
    if (this.game.hasMusic) {
      musicInit = this.game.add.audio('music-game');
      musicInit.play();
    }

    game.stage.backgroundColor = 0x000000;

    var color = Phaser.Color.getWebRGB(0xFFFFFF);
    var style = {font: "24px Helvetica", fill: color, align: "center"};

    initRules = game.add.text(50, 100, 'Test', style);
    initRules.alpha = 0.0;

    initLevel = game.add.text(50, 100 + 100, 'Test', style);
    initLevel.alpha = 0.0;
    self.runGameRound();
  },

  runGameRound: function () {
    if (typeof pleaseWait !== 'undefined') {
      pleaseWait.alpha = 0.0;
    }

    initRules.text = 'Rules: ' + Room.rules.mode.label;
    initLevel.text = 'Level: ' + Room.rules.level.label;

    game.add.tween(initRules.scale).to({x: 2.0, y: 2.0}, 1000, 'Bounce').start();
    game.add.tween(initRules).to({alpha: 1.0}, 500, 'Linear').start();

    var levelScaleIn = game.add.tween(initLevel.scale).to({x: 2.0, y: 2.0}, 1000, 'Bounce').delay(500).start();
    game.add.tween(initLevel).to({alpha: 1.0}, 500, 'Linear').delay(500).start();

    levelScaleIn.onComplete.add(function () {
      setTimeout(function () {
        if (this.game.hasMusic) {
          musicInit.stop();
        }
        game.stateTransition.to('game-round-no-monster', true, false);
      }, 2000);
    }, this);
  }
};
