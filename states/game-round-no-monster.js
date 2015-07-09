var direction = 'right';
var updateTimer = 0;
var jumpTimer = 0;
var shootTimer = 0;
var lasers = [];
var readyForDoubleJump = false;
var doubleJumped = false;
var emitterLifeSpan = 0;
var flying = false;
var groundPounding = false;
var shadowOffset = new Phaser.Point(10, 8);
var defaultHp = 50;
var live = false;
var updateRate = 2000;
var shooted = false;
var shootCoords = {};
function GameRoundNoMonsterState() {}
GameRoundNoMonsterState.prototype = {
    init: function(initData) {
        self = this;
        self.initData = initData;

        game.room = {
            players: []
        };
        game.kuzzle = new Kuzzle('http://api.uat.kuzzle.io:7512');
        var filters = {
            "filter": {
                "exists": {
                    "field": "username"
                }
            }
        };
        game.kuzzle.search('kf-users', filters, function(response) {
            response.result.hits.hits.forEach(function(e) {
                self.handleConnect(e._id, e._source);
            });
        });
        game.player = {
            username: "Sam-" + Math.floor((Math.random() * 1000) + 1),
            color:    Phaser.Color.getRandomColor(30, 220),
            hp:       100
        };
        game.kuzzle.create('kf-users', game.player, true, function(createData) {
            game.player.id = createData.result._id;
            game.kuzzle.create('kf-room-1', {pid: game.player.id}, true, function(updateData) {
                game.player.updateId = updateData.result._id;
                roomIdPlayers = game.kuzzle.subscribe('kf-users', {exists: {field: 'username'}}, function(dataPlayer) {
                    if(dataPlayer.action == "create" && dataPlayer._id != game.player.id) {
                        self.handleConnect(dataPlayer._id, dataPlayer.body);
                    }
                    if(dataPlayer.action == "delete") {
                        self.handleDisconnect(dataPlayer);
                    }
                });
                roomIdGameUpdates = game.kuzzle.subscribe('kf-room-1', {exists: {field: 'pid'}}, function(dataGameUpdate) {
                    self.updateFromKuzzle(dataGameUpdate.body);
                });
                live = true;
                console.log('Live!');
            });
        });
    },
    preload: function() {
        game.load.image('player', 'assets/sprites/game-round/player.png');
        game.load.image('smoke-particle', 'assets/sprites/game-round/smoke.png');
        game.load.image('blood-particle', 'assets/sprites/game-round/blood-particle.png');
        game.load.image('laser', 'assets/sprites/game-round/laser.png');
        game.time.advancedTiming = true;
    },
    create: function() {
        musicGameRound = game.add.audio('music-game');
        if(game.hasMusic) musicGameRound.fadeIn();

        game.renderer.renderSession.roundPixels = true;
        game.stage.backgroundColor = 0x444444;

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 1000;

        filterPixelate6      = new PIXI.PixelateFilter();
        filterPixelate6.size = {x: 6, y: 6};
        filterPixelate3      = new PIXI.PixelateFilter();
        filterPixelate3.size = {x: 3, y: 3};

        playerShadow = self.addPlayerShadow();
        player       = self.addPlayer();
        emitter      = self.addPlayerEmitter();

        blood = game.add.emitter(player.x, player.y, 250);
        blood.makeParticles('blood-particle', 0, 100, false, true);
        blood.setXSpeed(-100, 100);
        blood.setYSpeed(10, -500);
        blood.setAlpha(1, 0.4, 3000);
        blood.setScale(1.0, 2.0, 1.0, 2.0, 2000, Phaser.Easing.Quintic.Out);
        blood.bounce.setTo(0.2, 0.2);
        blood.angularDrag = 30;
        blood.gravity = -100;

        style                = {font: '42px Helvetica', fontWeight: 'bold', fill: "#BF0000", align: "center"};
        deathMessage         = game.add.text(player.x, player.y, "F#@k U!!", style);
        deathMessage.alpha   = 0.0;
        deathMessage.filters = [filterPixelate3];

        cursors    = game.input.keyboard.createCursorKeys();
        jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        self.game.input.onDown.add(self.fullScreen, self);

        self.enterKey      = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        self.fullscreenKey = this.game.input.keyboard.addKey(Phaser.Keyboard.F);
        self.quitKey       = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
        self.enterKey.onDown.add(self.switchKuzzleSynch, self);
        self.fullscreenKey.onDown.add(self.fullScreen, self);
        self.quitKey.onDown.add(self.quitGame, self);
    },
    switchKuzzleSynch: function() {
        live = !live;
    },
    addPlayer: function() {
        var p = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        game.physics.enable(p, Phaser.Physics.ARCADE);
        p.filters = [filterPixelate6];
        p.blendMode = PIXI.blendModes.ADD;
        p.body.collideWorldBounds = true;
        p.body.bounce.setTo(0.8, 0.5);
        p.anchor.setTo(0.5, 1.0);
        p.height = 85;
        p.width = 64;

        return p;
    },
    addPlayerShadow: function() {
        var ps = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        ps.anchor.setTo(0.5, 1.0);
        ps.tint = 0x000000;
        ps.alpha = 0.6;
        ps.height = 85;
        ps.width = 64;

        return ps;
    },
    addPlayerEmitter: function() {
        e = game.add.emitter(game.world.centerX, game.world.centerY, 8);
        e.setScale(0.2, 1.0, 0.2, 1.0, 3000, Phaser.Easing.Elastic.Out);
        e.filters = [filterPixelate6];
        e.makeParticles('smoke-particle');
        e.setAlpha(1, 0, 3000);
        e.setXSpeed(0, 0);
        e.setYSpeed(0, 0);
        e.gravity = -800;
        e.start(false, 2000, 20);
        e.on = false;

        return e;
    },
    addPlayerHpMeter: function() {
        var style = {font: '48px Helvetica', fontWeight: 'bold', fill: "#FFF", align: "center"};
        t = game.add.text(game.world.centerX, game.world.centerY, defaultHp, style);
        t.filters = [filterPixelate6];

        return t;
    },
    updateFromKuzzle: function(data) {
        game.room.players.forEach(function(e) {
            if(e.id == data.pid) {
                e.sprite.x = data.x;
                e.sprite.y = data.y;
                e.sprite.body.velocity.x = data.vx;
                e.sprite.body.velocity.y = data.vy;
                e.emitter.on = data.emits;
                if(e.shoot) {
                    //e.shootLaser(e.shoot);
                }
            }
        });
    },
    update: function() {
        this.updatePlayers();
        game.physics.arcade.collide(blood, player);
        if(game.time.now > updateTimer && live) {
            updateTimer = game.time.now + updateRate;

            game.kuzzle.update("kf-room-1", {
                _id  : game.player.updateId,
                pid  : game.player.id,
                hp   : game.player.hp,
                x    : player.x,
                y    : player.y,
                vx   : player.body.velocity.x,
                vy   : player.body.velocity.y,
                emits: emitter.on,
                shoot: shooted ? shootCoords : false
            }, function(r) { console.log(r); });

            if(shooted) shooted = false;
        }
    },
    fullScreen: function() {
        game.scale.startFullScreen();
    },
    updatePlayers: function() {
        playerShadow.x = player.x + shadowOffset.x;
        playerShadow.y = player.y + shadowOffset.y;

        blood.x = player.x;
        blood.y = player.y;

        emitter.emitX = player.x;
        emitter.emitY = player.y;

        game.room.players.forEach(function(e) {
            var ex = e.sprite.x;
            var ey = e.sprite.y;
            e.shadow.x = ex + shadowOffset.x;
            e.shadow.y = ey + shadowOffset.y;
            if(e.emits) {
                e.emitter.emitX = ex;
                e.emitter.emitY = ey;
            }
            /*e.hpMeter.x = ex + shadowOffset.x;
            e.hpMeter.y = ey + shadowOffset.y;*/
        });

        if (cursors.left.isDown) {
            player.body.velocity.x = -300;
        }
        if(cursors.right.isDown) {
            player.body.velocity.x = 300;
        }
        if(player.body.velocity.x > 0) {
            direction = 'right';
            player.body.velocity.x = player.body.velocity.x - 5;
            game.add.tween(player.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
            game.add.tween(playerShadow.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
        }
        if(player.body.velocity.x < 0) {
            direction = 'left';
            player.body.velocity.x = player.body.velocity.x + 5;
            game.add.tween(player.scale).to({x: -1}, 75, Phaser.Easing.Bounce.Out, true);
            game.add.tween(playerShadow.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
        }
        if(player.body.onFloor()) {
            player.body.gravity.y = 1000;
        }
        if(jumpButton.isDown && (player.body.onFloor() || player.body.wasTouching.down) && game.time.now > jumpTimer) {
            if(player.body.wasTouching.down)
                player.body.velocity.y = -1000;
            else
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
            player.body.velocity.y = -750;
            player.body.gravity.y = -500;
            readyForDoubleJump = false;
            doubleJumped = true;
            emitter.start(false, 2000, 20);
            emitterLifeSpan = 30;
        }

        if(emitterLifeSpan > 0) {
            emitterLifeSpan = emitterLifeSpan - 1;
        } else {
            player.body.gravity.y = 300;
            emitter.on = false;
        }

        if(flying && player.body.onFloor() && groundPounding) {
            flying = false;
            game.juicy.shake(30, 100);
            //game.juicy.jelly(player, 1.5, 100);
            this.tweenTint(player, 0x333333, 0xFF11FF, 500);
        }

        if(cursors.down.isDown && !player.body.onFloor() && !player.body.wasTouching.down) {
            player.body.gravity.y = 10000;
            groundPounding = true;
        } else {
            player.body.gravity.y = 100;
            groundPounding = false;
        }

        if(fireButton.isDown && game.time.now > shootTimer) {
            shootTimer = game.time.now + 1500;
            this.shootLaser();
            shooted = true;
            shootCoords = {x: player.x, y: player.y};
        }

        lasers.forEach(function(l) {
            game.room.players.forEach(function(p) {
                game.physics.arcade.collide(l, p.sprite, self.handleCollisionBetweenLasersAndEnemies, null, self);
            });
        });
        game.room.players.forEach(function(p) {
            game.physics.arcade.collide(player, p.sprite, self.handleCollisionBetweenPlayers, null, self);
        });

        deathMessage.x = player.x - 80;
        deathMessage.y = player.y - 140;
    },
    shootLaser: function() {
        var posX = direction == 'right' ? player.x + 50 : player.x - 150;
        var laser = game.add.sprite(posX, player.y - 50, 'laser');
        game.physics.enable(laser, Phaser.Physics.ARCADE);
        laser.events.onOutOfBounds.add(self.destroyLaser, self);
        laser.width = 80;
        laser.height = 50;
        laser.checkWorldBounds = true;
        laser.body.gravity.y = -1000;
        laser.tint = Phaser.Color.getRandomColor(100, 255);
        laser.blendMode = PIXI.blendModes.ADD;

        if(direction == 'right')
            laser.body.velocity.x = 2000;
        if(direction == 'left')
            laser.body.velocity.x = -2000;
        lasers.push(laser);
    },
    destroyLaser: function(laser) {
        laser.kill();
        laser.destroy();
    },
    handleCollisionBetweenPlayers: function() {
        console.log('collide!!!!!!!!');
    },
    handleCollisionBetweenLasersAndEnemies: function() {
        console.log('laser collide!!!!!!!!!!!!');
    },
    tweenTint: function(obj, startColor, endColor, time) {
        var colorBlend = {step: 0};
        colorTween = this.game.add.tween(colorBlend).to({step: 100}, time, 'Linear'/*, true, 0, -1*/);
        colorTween.onUpdateCallback(function() {
            obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
        });
        colorTween.onComplete.add(function() {
            obj.tint = 0xFFFFFF;
            self.game.stage.setBackgroundColor(0x444444);
        });
        obj.tint = startColor;
        self.game.stage.setBackgroundColor(0xFF0000);

        colorTween.start();
    },
    handleConnect: function(_id, p) {
        var newPlayer = {
            id       : _id,
            username : p.username,
            color    : p.color,
            hp       : defaultHp,
            shadow   : this.addPlayerShadow(),
            sprite   : this.addPlayer(),
            emitter  : this.addPlayerEmitter(),
            //hpMeter: this.addPlayerHpMeter(),
            x        : p.x,
            y        : p.y,
            vx       : p.vx,
            vy       : p.vy
        };
        newPlayer.sprite.tint = newPlayer.color;
        game.room.players.push(newPlayer);
    },
    handleDisconnect: function(p) {
        game.room.players.forEach(function(e, i) {
            if(e.id == p._id) {
                e.kill();
                e.destroy();
                game.room.players.splice(i, 1);
            }
        });
    },
    quitGame: function() {
        game.kuzzle.unsubscribe(roomIdPlayers);
        game.kuzzle.unsubscribe(roomIdGameUpdates);
        game.kuzzle.delete('kf-users', game.player.id, function() {
            game.kuzzle.delete('kf-users', game.player.id, function() {
                musicGameRound.stop();
                game.stateTransition.to('main-menu');
            });
        });
    },
    render: function() {
        game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
    }
};