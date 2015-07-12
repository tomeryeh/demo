var direction = 'right';
var updateTimer = 0;
var jumpTimer = 0;
var shootTimer = 0;
var shootRecover = 500;
var lasers = [];
var readyForDoubleJump = false;
var doubleJumped = false;
var emitterLifeSpan = 0;
var flying = false;
var groundPounding = false;
var shadowOffset = new Phaser.Point(10, 8);
var defaultHp = 50;
var laserDamage = 5;
var groundPoundDamage = 50;
var live = false;
var updateRate = 2000;
var shooted = false;
var shootCoords = {};
var hasDamaged = [];
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
            "username": "Sam-" + Math.floor((Math.random() * 1000) + 1),
            "color"   : Phaser.Color.getRandomColor(30, 220),
            "hp"      : 100
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
                roomIdGameUpdates = game.kuzzle.subscribe('kf-room-1', {exists: {field: 'username'}}, function(dataGameUpdate) {
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
        game.load.image('city', 'assets/sprites/game-round/background-city.png');

        game.load.tilemap('city-map', 'assets/maps/city.csv', null, Phaser.Tilemap.CSV);
        game.load.image('tiles-city', 'assets/sprites/game-round/tiles-city.png');

        game.load.tilemap('mario-map', 'assets/maps/mario.csv', null, Phaser.Tilemap.CSV);
        game.load.image('tiles-mario', 'assets/sprites/game-round/tiles-mario.png');

        game.load.bitmapFont('font', 'assets/fonts/font.png', 'assets/fonts/font.fnt');

        game.load.spritesheet('pierre-idle', 'assets/sprites/game-round/pierre-idle.png', 42, 102, 2);
        game.load.spritesheet('pierre-run', 'assets/sprites/game-round/pierre-run.png', 42, 102, 2);

        game.time.advancedTiming = true;
    },
    create: function() {
        musicGameRound = game.add.audio('music-game');
        if(game.hasMusic) musicGameRound.fadeIn();

        game.world.setBounds(0, 0, 400, 200);
        background = game.add.sprite(game.world.centerX, game.world.centerY, 'city');

        game.renderer.renderSession.roundPixels = true;
        game.stage.backgroundColor = 0x444444;
        //game.stage.backgroundColor = 0x5e81a2;

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 1000;

        filterPixelate6      = new PIXI.PixelateFilter();
        filterPixelate6.size = {x: 6, y: 6};
        filterPixelate3      = new PIXI.PixelateFilter();
        filterPixelate3.size = {x: 3, y: 3};

        playerShadow = self.addPlayerShadow();
        player       = self.addPlayer(game.player.id);
        emitter      = self.addPlayerEmitter();
        hpMeter      = self.addPlayerHPMeter();
        tag          = self.addPlayerTag(game.player.username);
        blood        = self.addPlayerBlood();
        //game.camera.follow(player);

        map = game.add.tilemap('city-map', 20, 20);
        map.addTilesetImage('tiles-city');
        /*map = game.add.tilemap('mario-map', 21, 21);
        map.addTilesetImage('tiles-mario', 'tiles-mario', 21, 21, 2, 2);*/
        map.setCollisionBetween(0, 2000);
        layer = map.createLayer(0);
        layer.resizeWorld();

        style                = {font: '42px Helvetica', fontWeight: 'bold', fill: "#BF0000", align: "center"};
        //deathMessage         = game.add.text(player.x, player.y, "F#@k U!!", style);
        deathMessage         = game.add.bitmapText(10, 100, 'font', 'Awesome :-D', 48);
        deathMessage.alpha   = 0.0;
        deathMessage.filters = [filterPixelate3];
        deathMessage.anchor.setTo(0.5, 0.5);

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
    addPlayer: function(id) {
        //var p = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        var p = game.add.sprite(game.world.centerX, game.world.centerY, 'pierre-idle');
        game.physics.enable(p, Phaser.Physics.ARCADE);
        //p.filters = [filterPixelate6];
        //.blendMode = PIXI.blendModes.ADD;
        p.body.collideWorldBounds = true;
        p.body.bounce.setTo(0.8, 0.5);
        p.body.linearDamping = 1;
        p.anchor.setTo(0.5, 1.0);
        p.hp = defaultHp;
        p.height = 102;
        //p.width = 64;
        p.width = 42;
        p.id = id;
        p.animations.add('idle');
        p.animations.play('idle', 2, true);
        p.smoothed = false;
        //p.scale.set(1.5);

        return p;
    },
    addPlayerShadow: function() {
        var ps = game.add.sprite(game.world.centerX, game.world.centerY, 'pierre-idle');
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
    addPlayerHPMeter: function() {
        var style = {font: '36px Helvetica', fontWeight: 'bold', fill: "#FFF", align: "center"};
        h = game.add.text(game.world.centerX, game.world.centerY, decorHP, style);
        h.filters = [filterPixelate3];

        return h;
    },
    addPlayerTag: function(tag) {
        var style = {font: '26px Helvetica', fontWeight: 'bold', fill: "#FFF", align: "center"};
        h = game.add.text(game.world.centerX, game.world.centerY, tag, style);
        h.filters = [filterPixelate3];

        return h;
    },
    addPlayerBlood: function() {
        b = game.add.emitter(game.world.centerX, game.world.centerY, 250);
        b.makeParticles('blood-particle', 0, 100, false, true);
        b.setXSpeed(-100, 100);
        b.setYSpeed(10, -500);
        b.setAlpha(1, 0.4, 3000);
        b.setScale(1.0, 2.0, 1.0, 2.0, 2000, Phaser.Easing.Quintic.Out);
        b.bounce.setTo(0.2, 0.2);
        b.angularDrag = 30;
        b.gravity = -100;

        return b;
    },
    updateFromKuzzle: function(data) {
        console.log('UPDATE FROM KUZZLE');
        game.room.players.forEach(function(e) {
            if(e.id == data.pid) {
                e.sprite.x = data.x;
                e.sprite.y = data.y;
                e.sprite.body.velocity.x = data.vx;
                e.sprite.body.velocity.y = data.vy;
                e.emitter.on = data.emits;
                if(data.damaged.length > 0) {
                    e.damaged.forEach(function(d) {
                        self.playerTakesDamage(getPlayerById(d.id), d.dmg);
                    });
                }
            }
        });
    },
    mapCollide: function() {
        onMap = true;
    },
    update: function() {
        game.camera.x = player.x - 320;
        game.camera.y = player.y - 180;
        if(typeof background != "undefined") {
            background.x = game.camera.x - (100 * (player.x / 620));
            background.y = game.camera.y - (100 * (player.y / 200));
            background.z = -1;
        }

        onMap = false;
        game.physics.arcade.collide(player, layer, self.mapCollide, null, self);

        this.updatePlayers();

        if(game.time.now > updateTimer && live) {
            console.log('Update');
            updateTimer = game.time.now + updateRate;
            game.kuzzle.update("kf-room-1", {
                _id    : game.player.updateId,
                pid    : game.player.id,
                hp     : game.player.hp,
                x      : player.x,
                y      : player.y,
                vx     : player.body.velocity.x,
                vy     : player.body.velocity.y,
                emits  : emitter.on,
                shoot  : shooted ? shootCoords : false,
                damaged: hasDamaged
            }, function(r) { console.log(r); });
            if(hasDamaged.length > 0) {
                hasDamaged = [];
            }
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

        hpMeter.x = player.x + shadowOffset.x - (player.width + 20);
        hpMeter.y = player.y + shadowOffset.y - (player.height + 40);

        tag.x = player.x - (player.width - 35);
        tag.y = player.y - (player.height + 30);

        deathMessage.x = player.x + 60;
        deathMessage.y = player.y - 100;

        game.room.players.forEach(function(p) {
            var px = p.sprite.x;
            var py = p.sprite.y;
            p.shadow.x   = px + shadowOffset.x;
            p.shadow.y   = py + shadowOffset.y;
            p.hpMeter.x  = px + shadowOffset.x - (p.sprite.width + 20);
            p.hpMeter.y  = py + shadowOffset.y - (p.sprite.height + 40);
            p.tag.x      = px + (p.sprite.width - 93);
            p.tag.y      = py + (p.sprite.height - 200);
            p.blood.x    = px;
            p.blood.y    = py;
            if(p.hp <= 0) {
                game.physics.arcade.collide(player, p.blood);
                game.room.players.forEach(function(pb) {
                    game.physics.arcade.collide(pb, p.blood);
                });
            }
            if(p.emits) {
                p.emitter.emitX = px;
                p.emitter.emitY = py;
            }
            game.physics.arcade.collide(p.sprite, layer);
        });

        if (cursors.left.isDown) {
            player.body.velocity.x = -300;
        }
        if(cursors.right.isDown) {
            player.body.velocity.x = 300;
        }
        if(player.body.velocity.x > 0) {
            player.loadTexture('pierre-run', 0, false);
            player.animations.add('run');
            player.animations.play('run', 3, true);
            direction = 'right';
            player.body.velocity.x = player.body.velocity.x - 5;
            game.add.tween(player.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
            game.add.tween(playerShadow.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
        } else if(player.body.velocity.x < 0) {
            player.loadTexture('pierre-run', 0, false);
            player.animations.add('run');
            player.animations.play('run', 3, true);
            direction = 'left';
            player.body.velocity.x = player.body.velocity.x + 5;
            game.add.tween(player.scale).to({x: -1}, 75, Phaser.Easing.Bounce.Out, true);
            game.add.tween(playerShadow.scale).to({x: 1}, 75, Phaser.Easing.Bounce.Out, true);
        } else {
            player.loadTexture('pierre-idle', 0, false);
            player.animations.add('idle');
            player.animations.play('idle', 2, true);
        }
        if(player.body.onFloor()) {
            player.body.gravity.y = 1000;
        }
        if(jumpButton.isDown && (player.body.onFloor() || player.body.wasTouching.down || player.body.blocked.down || onMap) && game.time.now > jumpTimer) {
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
            shootTimer = game.time.now + shootRecover;
            this.shootLaser();
            shooted = true;
            shootCoords = {x: player.x, y: player.y};
        }

        lasers.forEach(function(l, i) {
            game.room.players.forEach(function(p) {
                if(!l.touched){
                    game.physics.arcade.overlap(l, p.sprite, function (l, p) {
                        l.touched = true;
                        var laserDisapear = game.add.tween(l).to({alpha: 0.0}, 200, 'Linear', true);
                        laserDisapear.onComplete.add(function (l) {
                            l.destroy();
                            lasers.splice(i, 1);
                        });
                        self.handleCollisionBetweenLasersAndEnemies(l, p)
                    }, null, self);
                }
            });
        });
        game.room.players.forEach(function(p) {
            game.physics.arcade.collide(player, p.sprite, self.handleCollisionBetweenPlayers, null, self);
        });
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
        laser.touched = false;

        if(direction == 'right')
            laser.body.velocity.x = 1200;
        if(direction == 'left')
            laser.body.velocity.x = -1200;
        lasers.push(laser);
    },
    destroyLaser: function(laser) {
        laser.kill();
        laser.destroy();
    },
    handleCollisionBetweenPlayers: function(p, e) {
        if(groundPounding && flying) {
            enemy = getPlayerById(e.id);
            game.juicy.shake(30, 60);
            flying = false;
            enemy.hp -= groundPoundDamage;
            enemy.hpMeter.text = enemy.hp;
            enemy.hpMeter.tint = Phaser.Color.interpolateColor(0xFF0000, 0xFFFFFF, defaultHp, enemy.hp);
            this.tweenTint(e, 0x333333, 0xFF11FF, 100);
            hasDamaged.push({id: enemy.id, dmg: groundPoundDamage});
            if(enemy.hp <= 0) {
                self.playerDies(enemy);
            }
        }
    },
    handleCollisionBetweenLasersAndEnemies: function(l, p) {
        p.body.velocity.x = l.body.velocity.x / 10;
        game.room.players.forEach(function(e) {
            if(e.id == p.id) {
                hasDamaged.push({id: e.id, dmg: laserDamage});
                self.playerTakesDamage(e, laserDamage);
            }
        })
    },
    playerTakesDamage: function(p, dmg) {
        self.tweenTint(p, 0x333333, 0xFF11FF, 100);
        p.blood.start(false, 100, 100);
        p.blood.on = false;
        p.hp -= dmg;
        p.hpMeter.text = p.hp;
        p.hpMeter.tint = Phaser.Color.interpolateColor(0xFF0000, 0xFFFFFF, defaultHp, p.hp);
        if(p.hp <= 0) {
            self.playerDies(p);
        }
    },
    playerDies: function(p) {
        p.blood.start(false, 1500, 2);
        p.blood.filters = [filterPixelate3];
        p.hpMeter.destroy();
        p.tag.destroy();
        var dieAnimation = game.add.tween(p.sprite).to({alpha: 0.0}, 500, 'Linear').start();
        game.add.tween(p.shadow).to({alpha: 0.0}, 500, 'Linear').start();
        dieAnimation.onComplete.add(function() {
            p.sprite.destroy();
            p.shadow.destroy();
            p.blood.on = false;
            var messages = ["Monster Kill", "Yeaaaaahhh!!", "Stay down!!", "Awesome :D", "Niiiiice!!", "Time to\nKick ass!", "Eat dirt!"];
            deathMessage.text = messages[Math.floor(Math.random() * messages.length)];
            game.add.tween(deathMessage.scale).to({x: 2.0, y: 2.0}, 1500, 'Elastic', true);
            game.add.tween(deathMessage).to({angle: 350.0}, 1500, 'Elastic', true);
            var deathMessageIn = game.add.tween(deathMessage).to({alpha: 1.0}, 1500, Phaser.Easing.Exponential.Out, true);
            deathMessageIn.onComplete.add(function() {
                game.add.tween(deathMessage).to({alpha: 0.0}, 500, 'Elastic', true);
            });
        });
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
            if(typeof background != "undefined")
                background.tint = 0xFFFFFF;
        });
        obj.tint = startColor;
        self.game.stage.setBackgroundColor(0xFF0000);
        if(typeof background != "undefined")
            background.tint = 0xFF0000;

        colorTween.start();
    },
    handleConnect: function(_id, p) {
        var newPlayer = {
            id      : _id,
            username: p.username,
            color   : p.color,
            hp      : defaultHp,
            shadow  : this.addPlayerShadow(),
            sprite  : this.addPlayer(_id),
            emitter : this.addPlayerEmitter(),
            hpMeter : this.addPlayerHPMeter(),
            tag     : this.addPlayerTag(p.username),
            blood   : this.addPlayerBlood(),
            x       : p.x,
            y       : p.y,
            vx      : p.vx,
            vy      : p.vy
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