var jumpTimer = 0;
var readyForDoubleJump = false;
var doubleJumped = false;
var emitterLifeSpan = 0;
var flying = false;
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
        player.height = 50;
        player.width = 30;

        decor = game.add.sprite(game.world.centerX / 2, (game.world.centerY * 2) - 50, 'player');
        decor.anchor.setTo(0.5, 0.5);
        decor.height = 100;
        decor.width = 60;

        game.physics.enable(player, Phaser.Physics.ARCADE);
        player.body.bounce.x = 0.8;
        player.body.bounce.y = 0.5;
        player.body.collideWorldBounds = true;

        //game.camera.follow(player);

        emitter = game.add.emitter(game.world.centerX, game.world.centerY, 400);
        emitter.makeParticles('smoke-particle');
        emitter.setXSpeed(0, 0);
        emitter.setYSpeed(0, 0);
        emitter.setAlpha(1, 0, 3000);
        emitter.setScale(0.0, 1, 0.0, 1, 6000, Phaser.Easing.Quintic.Out);
        emitter.gravity = -800;
        emitter.emitX = 64;
        emitter.emitY = 500;

        cursors = game.input.keyboard.createCursorKeys();
        jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

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
            player.body.velocity.x = -300;
        }
        if(cursors.right.isDown) {
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
            this.kuzzleFlash(1, 2000);
            this.tweenTint(player, player.color, 0xFF0000, 500);
            this.tweenTint(decor, decor.color, 0xFF0000, 500);
        }

        if(cursors.up.isDown) {
            player.body.velocity.x = 200;
        }
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
        });

        // set the object to the start color straight away
        obj.tint = startColor;

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