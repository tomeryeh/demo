var direction = 'right';
var jumpTimer = 0;
var shootTimer = 0;
var lasers = [];
var readyForDoubleJump = false;
var doubleJumped = false;
var emitterLifeSpan = 0;
var flying = false;
var decorHP = 100;
var groundPounding = false;
function GameRoundState() {}
GameRoundState.prototype = {
    init: function(initData) {
        this.initData = initData;
        console.log('Init data: ' + initData);
    },
    preload: function() {
        //game.load.tilemap('level1', 'assets/games/starstruck/level1.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image('player', 'assets/sprites/game-round/player.png');
        game.load.image('smoke-particle', 'assets/sprites/game-round/smoke-particle.png');
        game.load.image('laser', 'assets/sprites/game-round/laser.png');
        /*game.load.spritesheet('dude', 'assets/games/starstruck/dude.png', 32, 48);
        game.load.spritesheet('droid', 'assets/games/starstruck/droid.png', 32, 32);
        game.load.image('starSmall', 'assets/games/starstruck/star.png');
        game.load.image('starBig', 'assets/games/starstruck/star2.png');
        game.load.image('background', 'assets/games/starstruck/background2.png');*/
    },
    create: function() {
        musicGameRound = game.add.audio('music-game');
        if(game.hasMusic) musicGameRound.fadeIn();

        game.gameData.players = [];
        self = this;

        /* GAME LOGIC */

        game.stage.backgroundColor = 0x000000;

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 1000;

        player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        player.anchor.setTo(0.5, 0.5);
        player.height = 85;
        player.width = 64;

        decor = game.add.sprite(game.world.centerX / 2, (game.world.centerY * 2) - 85, 'player');
        decor.anchor.setTo(0.5, 0.5);
        decor.height = 170;
        decor.width = 128;
        game.physics.enable(decor, Phaser.Physics.ARCADE);
        decor.body.bounce.setTo(0.2, 0.2);
        decor.body.collideWorldBounds = true;

        var style = {font: '64px Arial', fontWeight: 'bold', fill: "#FFF", align: "center"};
        decorHPText = game.add.text(decor.x - 64, decor.y - 170, "100", style);

        game.physics.enable(player, Phaser.Physics.ARCADE);
        player.body.bounce.setTo(0.8, 0.5);
        player.body.collideWorldBounds = true;

        //game.camera.follow(player);

        emitter = game.add.emitter(game.world.centerX, game.world.centerY, 400);
        emitter.makeParticles('smoke-particle');
        emitter.setXSpeed(0, 0);
        emitter.setYSpeed(0, 0);
        emitter.setAlpha(1, 0, 3000);
        emitter.setScale(0.0, 1.2, 0.0, 1.2, 6000, Phaser.Easing.Quintic.Out);
        emitter.gravity = -800;

        cursors = game.input.keyboard.createCursorKeys();
        jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        /* END GAME LOGIC */

        this.game.input.onDown.add(this.quitGame, this);
        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enterKey.onDown.add(this.quitGame, this);
    },
    update: function() {
        this.updatePlayers();
    },
    updatePlayers: function() {
        emitter.emitX = player.x;
        emitter.emitY = player.y;

        if(player.body.velocity.x > 0)
            player.body.velocity.x = player.body.velocity.x - 5;
        if(player.body.velocity.x < 0)
            player.body.velocity.x = player.body.velocity.x + 5;

        if (cursors.left.isDown) {
            direction = 'left';
            player.body.velocity.x = -300;
        }
        if(cursors.right.isDown) {
            direction = 'right';
            player.body.velocity.x = 300;
        }

        if(player.body.onFloor()) {
            player.body.gravity.y = 1000;
        }
        if(jumpButton.isDown && player.body.onFloor() && game.time.now > jumpTimer) {
            player.body.velocity.y = -500;
            jumpTimer = game.time.now + 750;
            readyForDoubleJump = false;
            doubleJumped = false;
        }
        if(!jumpButton.isDown && !player.body.onFloor() && !readyForDoubleJump && !doubleJumped) {
            readyForDoubleJump = true;
        }
        if(jumpButton.isDown && !player.body.onFloor() && readyForDoubleJump) {
            flying = true;
            player.body.velocity.y = -500;
            player.body.gravity.y = -500;
            readyForDoubleJump = false;
            doubleJumped = true;
            emitter.start(false, 4000, 20);
            emitterLifeSpan = 30;
        }

        if(emitterLifeSpan > 0) {
            emitterLifeSpan = emitterLifeSpan - 1;
        } else {
            player.body.gravity.y = 300;
            emitter.on = false;
        }

        if(flying && player.body.onFloor()) {
            flying = false;
            game.juicy.shake(30, 100);
            //game.juicy.jelly(player, 1.5, 100);
            this.kuzzleFlash(1, 2000);
            this.tweenTint(player, 0x333333, 0xFF11FF, 500);
            this.tweenTint(decor, 0x333333, 0xFF11FF, 500);
        }

        if(cursors.down.isDown) {
            player.body.gravity.y = 10000;
            groundPounding = true;
        } else {
            player.body.gravity.y = 100;
            groundPounding = false;
        }

        if(fireButton.isDown && game.time.now > shootTimer) {
            shootTimer = game.time.now + 50;
            this.shootLaser();
        }

        lasers.forEach(function(e) {
            game.physics.arcade.collide(e, decor, self.decorTakesDamage, null, self);
        });
        game.physics.arcade.collide(player, decor, self.decorTakesDamageFromGroundPound, null, self);

        decorHPText.x = decor.x - 64;
        decorHPText.y = decor.y - 170;
        decorHPText.text = decorHP;
        decorHPText.tint = Phaser.Color.interpolateColor(0xFF0000, 0xFFFFFF, 100, decorHP);
    },
    decorTakesDamageFromGroundPound: function() {
        if(groundPounding && flying) {
            game.juicy.shake(30, 60);
            flying = false;
            decorHP -= 20;
            this.tweenTint(decor, 0x333333, 0xFF11FF, 100);
            if(decorHP <= 0) {
                this.decorDies();
            }
        }
    },
    decorTakesDamage: function(l, d) {
        l.destroy();
        decorHP -= 1;
        this.tweenTint(decor, 0x333333, 0xFF11FF, 100);
        game.juicy.shake(20, 30);
        if(decorHP <= 0) {
            this.decorDies();
        }
    },
    decorDies: function() {
        decorHPText.destroy();
        var dieAnimation = game.add.tween(decor).to({alpha: 0.0}, 500, 'Linear').start();
        dieAnimation.onComplete.add(function() { decor.destroy() });
    },
    shootLaser: function() {
        var laser = game.add.sprite(player.x, player.y, 'laser');
        laser.width = 100;
        laser.height = 40;
        game.physics.enable(laser, Phaser.Physics.ARCADE);
        laser.checkWorldBounds = true;
        laser.body.gravity.x = -1000;
        laser.body.gravity.y = -1000;
        laser.x = player.x;
        laser.y = player.y;

        if(direction == 'right')
            laser.body.velocity.x = 6000;
        if(direction == 'left')
            laser.body.velocity.x = -6000;
        lasers.push(laser);
    },
    kuzzleFlash: function(maxAlpha, duration) {
        maxAlpha = maxAlpha || 1;
        duration = duration || 100;
        var flashTween = this.game.add.tween(self).to({alpha: maxAlpha}, duration, Phaser.Easing.Bounce.InOut, true, 0, 0, true);
        flashTween.onComplete.add(function() {
            self.alpha = 0;
        }, this);
    },
    tweenTint: function(obj, startColor, endColor, time) {
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
            self.game.stage.setBackgroundColor(0x000000);
        });

        // set the object to the start color straight away
        obj.tint = startColor;

        self.game.stage.setBackgroundColor(0xFF0000);

        // start the tween
        colorTween.start();
    },
    handleConnect: function() {
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
        //lobbyGame.kuzzle.unsubscribe(game.gameData.player.roomId);
        //lobbyGame.kuzzle.delete('kf-user', lobbyGame.gameData.player.id, function(response) {
            musicGameRound.stop();
            lobbyGame.stateTransition.to('main-menu');
        //});
    }
};