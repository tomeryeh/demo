function LobbyState() {}
LobbyState.prototype = {
  init: function (initData) {
    this.initData = initData;
  },

  preload: function () {
    game.load.audio('countdown', 'assets/sounds/countdown.mp3');
    game.load.bitmapFont('font-lobby', 'assets/fonts/quake.png', 'assets/fonts/quake.fnt');
  },

  create: function () {
    if(game.hasMusic) {
      musicLobby = game.add.audio('music-lobby');
      musicLobby.play();
    }

    audioCountdown = game.add.audio('countdown');
    game.player = this.initData.player;
    kuzzleGame = this.game;
    game.stage.backgroundColor = 0x000000;

    filterPixelate3      = new PIXI.PixelateFilter();
    filterPixelate3.size = {x: 3, y: 3};

    lobbyGame = game;
    self = this;

    self.lobbyDrawables = [];

    this.quitKey = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
    this.quitKey.onDown.add(this.quitGame, this);

    countingDown = 10;
    isCountingDown = false;

    countdown = game.add.bitmapText(320, 180, 'font-lobby', 'Ready?', 96);
    countdown.alpha = 0.0;
    countdown.filters = [filterPixelate3];
    countdown.anchor.setTo(0.5, 0.5);
    countdown.fixedToCamera = true;
    countdown.scale.set(1.5, 1.5);

    self.drawLobby();
  },

  startGame: function (gameStarted) {
    Object.keys(Players).forEach(function (id) {
      Players[id].updated = false;
      Players[id].hp = Configuration.player.hp;
    });

    kuzzleGame.stateTransition.to('game-init', true, false);

/*
    if (gameStarted) {
      this.game.stateTransition.to('game-init', true, false);
    }
    else {
      self.countDown();
    }
*/
  },

  drawLobby: function () {
    var yCoord = -68;
    var delay = 0;

    self.lobbyDrawables.forEach(function (g) {
      g.destroy();
    });

    Object.keys(Players).forEach(function(id, i) {
      var
        graphics = game.add.graphics(),
        e = Players[id],
        xCoord = 330;

      graphics.z = 0;
      graphics.alpha = 0.0;
      graphics.lineStyle(5, e.color, 1);

      if((i + 1) % 2 === 1) {
        xCoord = 20;
        yCoord += 70;
      }

      graphics.beginFill(e.color, 1);
      graphics.drawRect(xCoord, 20 + yCoord, 290, 56);
      graphics.endFill();

      var move = game.add.tween(graphics).to({alpha: 0.6}, 250, 'Linear').delay(delay).start();

      move.onComplete.add(function (graphics) {
        game.juicy.shake(5, 2);
      });

      game.add.tween(graphics).to({y:graphics.y - 10}, 250, Phaser.Easing.Elastic.In).delay(delay).start();

      var color = Phaser.Color.getWebRGB(0xFFFFFF);
      var style = {font: "28px Helvetica", fill: color, align: "center"};
      var text = game.add.text(320, 180, e.username, style);
      text.z = 0;
      text.x = xCoord + 10;
      text.y = yCoord + 20;
      text.alpha = 0;
      game.add.tween(text).to({alpha:1.0}, 250, 'Linear').delay(delay).start();
      game.add.tween(text).to({y:text.y - 10}, 250, Phaser.Easing.Elastic.In).delay(delay).start();

      self.lobbyDrawables.push(graphics);
      self.lobbyDrawables.push(text);

      if(e.id === game.player.id) {
        self.tweenTint(graphics, e.color, 0xFFFFFF, 500);
        self.tweenTint(text, e.color, 0xFFFFFF, 500);
      }

      delay += 100;
    });
  },
/*
  cd: function () {
    countdown.text = String.fromCharCode(199) + ' ' + countingDown + '!!';
    game.add.tween(countdown.scale).from({x: 3.0, y: 3.0}, 800, Phaser.Easing.Bounce.Out).start();
    game.add.tween(countdown).to({angle: 350}, 500, 'Elastic').start();
    game.add.tween(countdown).to({alpha: 1.0}, 200, Phaser.Easing.Exponential.Out).start();
    game.add.tween(countdown).to({alpha: 0.0}, 200, Phaser.Easing.Exponential.Out).delay(800).start();
    countingDown--;

    if (countingDown > 0) {
      setTimeout(function () {
        self.cd();
      }, 1000);
    }
  },

  countDown: function () {
      if (this.game.hasMusic) {
        musicLobby.fadeOut();
      }

      game.add.tween(countdown).to({alpha: 1.0}, 1000, Phaser.Easing.Exponential.Out).start();
      var readyScale = game.add.tween(countdown.scale).to({x: 2.0, y: 2.0}, 1000, Phaser.Easing.Exponential.Out).start();
      readyScale.onComplete.add(function () {
        game.add.tween(countdown).to({alpha: 0.0}, 200, Phaser.Easing.Exponential.Out).start();
      });

      setTimeout(function () {
        audioCountdown.play();
        self.cd();

        setTimeout(function () {
          if (game.hasMusic) {
            musicLobby.stop();
          }
          game.stateTransition.to('game-init', true, false);
        }, 10000);
      }, 2000);
  },
*/
  tweenTint: function (obj, startColor, endColor, time) {
    // create an object to tween with our step value at 0
    var colorBlend = {step: 0};

    // create the tween on this object and tween its step property to 100
    colorTween = this.game.add.tween(colorBlend).to({step: 100}, time, 'Linear', true, 0, -1);

    // run the interpolateColor function every time the tween updates, feeding it the
    // updated value of our tween each time, and set the result as our tint
    colorTween.onUpdateCallback(function () {
      obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
    });

    // set the object to the start color straight away
    obj.tint = startColor;

    // start the tween
    colorTween.start();
  },

  quitGame: function () {
    kuzzle.logout();

    if (game.hasMusic) {
      musicLobby.stop();
    }
    game.state.start('boot',true, false);
  }
};
