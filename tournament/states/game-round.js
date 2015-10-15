var direction = 'right';
var jumpTimer = 0;
var shootTimer = 0;
var lasers = [];
var readyForDoubleJump = false;
var doubleJumped = false;
var emitterLifeSpan = 0;
var flying = false;
var decorHP = 50;
var groundPounding = false;
var shadowOffset = new Phaser.Point(10, 8);
function GameRoundState() {}
GameRoundState.prototype = {
  init: function (initData) {
    this.initData = initData;
  },

  preload: function () {
    //game.load.tilemap('level1', 'assets/games/starstruck/level1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('player', 'assets/sprites/game-round/player.png');
    game.load.image('smoke-particle', 'assets/sprites/game-round/smoke.png');
    game.load.image('blood-particle', 'assets/sprites/game-round/blood-particle.png');
    game.load.image('laser', 'assets/sprites/game-round/laser.png');
    game.load.image('city', 'assets/sprites/game-round/background-city.png');
    game.time.advancedTiming = true;
    /*game.load.spritesheet('dude', 'assets/games/starstruck/dude.png', 32, 48);
    game.load.spritesheet('droid', 'assets/games/starstruck/droid.png', 32, 32);
    game.load.image('starSmall', 'assets/games/starstruck/star.png');
    game.load.image('starBig', 'assets/games/starstruck/star2.png');
    game.load.image('background', 'assets/games/starstruck/background2.png');*/
  },

  create: function () {
    game.renderer.renderSession.roundPixels = true;

    if (game.hasMusic) {
      musicGameRound = game.add.audio('music-game');
      musicGameRound.fadeIn();
    }

    game.room= {};
    game.Room.players = [];
    self = this;

    /* GAME LOGIC */
    game.stage.backgroundColor = 0x333333;
    background = game.add.sprite(0, 0, 'city');

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 1000;

    playerShadow = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    playerShadow.anchor.setTo(0.5, 1.0);
    playerShadow.height = 85;
    playerShadow.width = 64;
    playerShadow.tint = 0x000000;
    playerShadow.alpha = 0.6;
    player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    player.anchor.setTo(0.5, 1.0);
    player.height = 85;
    player.width = 64;

    filterPixelate7 = new PIXI.PixelateFilter();
    filterPixelate7.size = {x: 7, y: 7};
    filterPixelate3 = new PIXI.PixelateFilter();
    filterPixelate3.size = {x: 3, y: 3};

    this.spawnMonster();
    decor.blendMode = PIXI.blendModes.ADD;

    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.bounce.setTo(0.8, 0.5);
    player.body.collideWorldBounds = true;

    //game.camera.follow(player);

    emitter = game.add.emitter(game.world.centerX, game.world.centerY, 8);
    emitter.makeParticles('smoke-particle');
    emitter.setXSpeed(0, 0);
    emitter.setYSpeed(0, 0);
    emitter.setAlpha(1, 0, 3000);
    emitter.setScale(0.2, 1.0, 0.2, 1.0, 3000, Phaser.Easing.Elastic.Out);
    emitter.gravity = -800;

    blood = game.add.emitter(decor.x, decor.y, 250);
    blood.makeParticles('blood-particle', 0, 100, false, true);
    blood.setXSpeed(-100, 100);
    blood.setYSpeed(10, -500);
    blood.setAlpha(1, 0.4, 3000);
    blood.setScale(1.0, 2.0, 1.0, 2.0, 2000, Phaser.Easing.Quintic.Out);
    blood.bounce.setTo(0.2, 0.2);
    blood.angularDrag = 30;
    blood.gravity = -100;

    style = {font: '42px Helvetica', fontWeight: 'bold', fill: "#BF0000", align: "center"};
    deathMessage = game.add.text(player.x, player.y, "F#@k U!!", style);
    deathMessage.alpha = 0.0;

    cursors = game.input.keyboard.createCursorKeys();
    jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.UP);
    fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    /* END GAME LOGIC */

    this.game.input.onDown.add(this.fullScreen, this);
    this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    this.enterKey.onDown.add(this.fullScreen, this);

    //game.world.setBounds(0, 0, game.world.width, game.world.height * 1.5);
    //game.camera.follow(player);

    player.blendMode = PIXI.blendModes.ADD;
    deathMessage.filters = [filterPixelate3];
    //decorHPText.filters = [filter];
    /*player.filters = [filter];
    decor.filters = [filter];*/

    /*nfilter = game.add.filter('Vignette', game.width, game.height);
    nfilter.size = 0.3;
    nfilter.amount = 0.5;
    nfilter.alpha = 1.0;*/

    //filter[FILTER_SNOISE] = game.add.filter('SNoise');

    nfilter = new PIXI.AsciiFilter();
  },

  update: function () {
    this.updatePlayers();
    game.physics.arcade.collide(blood, player);
  },

  fullScreen: function () {
    game.scale.startFullScreen();
  },

  updatePlayers: function () {
    playerShadow.x = player.x + shadowOffset.x;
    playerShadow.y = player.y + shadowOffset.y;
    decorShadow.x = decor.x + shadowOffset.x;
    decorShadow.y = decor.y + shadowOffset.y;

    blood.x = decor.x;
    blood.y = decor.y;

    emitter.emitX = player.x;
    emitter.emitY = player.y;

    if (cursors.left.isDown) {
      player.body.velocity.x = -300;
    }

    if (cursors.right.isDown) {
      player.body.velocity.x = 300;
    }

    if (player.body.velocity.x > 0) {
      direction = 'right';
      player.body.velocity.x = player.body.velocity.x - 5;
      game.add.tween(player.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
      game.add.tween(playerShadow.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
    }

    if (player.body.velocity.x < 0) {
      direction = 'left';
      player.body.velocity.x = player.body.velocity.x + 5;
      game.add.tween(player.scale).to({x: -1}, 75, Phaser.Easing.Bounce.Out, true);
      game.add.tween(playerShadow.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
    }

    if (player.body.onFloor()) {
      player.body.gravity.y = 1000;
    }

    if (jumpButton.isDown && (player.body.onFloor() || player.body.wasTouching.down) && game.time.now > jumpTimer) {
      player.body.velocity.y = (player.body.wasTouching.down ? -1000 : -500);
      jumpTimer = game.time.now + 750;
      readyForDoubleJump = false;
      doubleJumped = false;
    }

    if (!jumpButton.isDown && !player.body.onFloor() && !readyForDoubleJump && !doubleJumped) {
      readyForDoubleJump = true;
    }

    if (jumpButton.isDown && !player.body.onFloor() && readyForDoubleJump) {
      flying = true;
      player.body.velocity.y = -750;
      player.body.gravity.y = -500;
      readyForDoubleJump = false;
      doubleJumped = true;
      emitter.start(false, 2000, 20);
      emitter.filters = [filterPixelate7];
      emitterLifeSpan = 30;
    }

    if (emitterLifeSpan > 0) {
      emitterLifeSpan = emitterLifeSpan - 1;
    }
    else {
      player.body.gravity.y = 300;
      emitter.on = false;
    }

    if (flying && player.body.onFloor() && groundPounding) {
      flying = false;
      //game.juicy.shake(30, 100);
      //game.juicy.jelly(player, 1.5, 100);
      this.kuzzleFlash(1, 2000);
      this.tweenTint(player, 0x333333, 0xFF11FF, 500);
      this.tweenTint(decor, 0x333333, 0xFF11FF, 500);
    }

    if (cursors.down.isDown && !player.body.onFloor() && !player.body.wasTouching.down) {
      player.body.gravity.y = 10000;
      groundPounding = true;
    }
    else {
      player.body.gravity.y = 100;
      groundPounding = false;
    }

    if (fireButton.isDown && game.time.now > shootTimer) {
      shootTimer = game.time.now + 150;
      this.shootLaser();
    }

    lasers.forEach(function (e) {
      game.physics.arcade.collide(e, decor, self.decorTakesDamage, null, self);
    });

    game.physics.arcade.collide(player, decor, self.decorTakesDamageFromGroundPound, null, self);

    decorHPText.x = decor.x - 64;
    decorHPText.y = decor.y - 170;
    decorHPText.text = decorHP;
    decorHPText.tint = Phaser.Color.interpolateColor(0xFF0000, 0xFFFFFF, 50, decorHP);

    deathMessage.x = player.x - 80;
    deathMessage.y = player.y - 140;
    player.filters = [filterPixelate3];
    //decor.filters = [filterPixelate3];

    game.stage.filters = [nfilter];
  },

  spawnMonster: function () {
    decorHP = 50;

    decorShadow = game.add.sprite(game.world.centerX / 2, (game.world.centerY * 2) - 85, 'player');
    decorShadow.anchor.setTo(0.5, 0.5);
    decorShadow.height = 170;
    decorShadow.width = 128;
    decorShadow.tint = 0x000000;
    decorShadow.alpha = 0.6;

    decor = game.add.sprite(game.world.centerX / 2, (game.world.centerY * 2) - 85, 'player');
    decor.anchor.setTo(0.5, 0.5);
    decor.height = 170;
    decor.width = 128;
    game.physics.enable(decor, Phaser.Physics.ARCADE);
    decor.body.bounce.setTo(0.2, 0.2);
    decor.body.collideWorldBounds = true;

    var style = {font: '64px Helvetica', fontWeight: 'bold', fill: "#FFF", align: "center"};
    decorHPText = game.add.text(decor.x - 64, decor.y - 170, decorHP, style);

    decorHPText.filters = [filterPixelate7];
  },

  decorTakesDamageFromGroundPound: function () {
    if(groundPounding && flying) {
      //game.juicy.shake(30, 60);
      flying = false;
      decorHP -= 20;
      this.tweenTint(decor, 0x333333, 0xFF11FF, 100);
      if(decorHP <= 0) {
        this.decorDies();
      }
    }
  },

  decorTakesDamage: function (l, d) {
    l.destroy();
    decorHP -= 1;
    this.tweenTint(decor, 0x333333, 0xFF11FF, 100);
    //game.juicy.shake(20, 30);
    if(decorHP <= 0) {
      this.decorDies();
    }
  },

  decorDies: function () {
    blood.start(false, 1500, 2);
    blood.filters = [filterPixelate3];
    decorHPText.destroy();
    var dieAnimation = game.add.tween(decor).to({alpha: 0.0}, 500, 'Linear').start();
    game.add.tween(decorShadow).to({alpha: 0.0}, 500, 'Linear').start();
    dieAnimation.onComplete.add(function () {
      decor.destroy();
      decorShadow.destroy();
      decor.kill();
      decorShadow.kill();
      blood.on = false;
      var deathMessageIn = game.add.tween(deathMessage).to({alpha: 1.0}, 1000, 'Elastic', true);
      deathMessageIn.onComplete.add(function () {
        game.add.tween(deathMessage).to({alpha: 0.0}, 500, 'Elastic', true);
      });
    });
  },

  shootLaser: function () {
    var posX = direction == 'right' ? player.x + 50 : player.x - 150;
    var laser = game.add.sprite(posX, player.y - 50, 'laser');
    laser.width = 80;
    laser.height = 50;
    laser.events.onOutOfBounds.add(this.destroyLaser, this);
    game.physics.enable(laser, Phaser.Physics.ARCADE);
    laser.checkWorldBounds = true;
    laser.body.gravity.y = -1000;
    var randColor = Phaser.Color.getRandomColor(100, 255);
    laser.tint = randColor;
    laser.blendMode = PIXI.blendModes.ADD;
    laser.body.velocity.x = (direction == 'right' ? 2000 : -2000);

    lasers.push(laser);
  },

  destroyLaser: function (laser) {
    console.log('DESTROY');
    laser.kill();
    laser.destroy();
  },

  kuzzleFlash: function (maxAlpha, duration) {
    maxAlpha = maxAlpha || 1;
    duration = duration || 100;
    var flashTween = this.game.add.tween(self).to({alpha: maxAlpha}, duration, Phaser.Easing.Bounce.InOut, true, 0, 0, true);
    flashTween.onComplete.add(function () {
      self.alpha = 0;
    }, this);
  },

  tweenTint: function (obj, startColor, endColor, time) {
    // create an object to tween with our step value at 0
    var colorBlend = {step: 0};

    // create the tween on this object and tween its step property to 100
    colorTween = this.game.add.tween(colorBlend).to({step: 100}, time, 'Linear'/*, true, 0, -1*/);

    // run the interpolateColor function every time the tween updates, feeding it the
    // updated value of our tween each time, and set the result as our tint
    colorTween.onUpdateCallback(function() {
      obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
    });

    colorTween.onComplete.add(function() {
      obj.tint = 0xFFFFFF;
      self.game.stage.setBackgroundColor(0x444444);
    });

    // set the object to the start color straight away
    obj.tint = startColor;

    self.game.stage.setBackgroundColor(0xFF0000);

    // start the tween
    colorTween.start();
  },

  handleConnect: function () {
    self.lobbyDrawables.forEach(function(e) {
      e.destroy();
    });
    self.lobbyDrawables = [];
    self.drawLobby();
  },

  handleDisconnect: function() {
    self.lobbyDrawables.forEach(function(e) {
      e.destroy();
    });
    self.lobbyDrawables = [];
    self.drawLobby();
  },

  quitGame: function() {
    musicGameRound.stop();
    lobbyGame.stateTransition.to('main-menu');
    //});
  },
  render: function() {
    game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
  }
};
