var direction = 'right';
var updateTimer = 0;
var jumpTimer = 0;
var shootTimer = 0;
var shootRecover = 500;
var nadeTimer = 0;
var nadeRecover = 2000;
var lasers = [];
var nades = [];
var nadeCount = 3;
var readyForDoubleJump = false;
var doubleJumped = false;
var emitterLifeSpan = 0;
var flying = false;
var groundPounding = false;
var shadowOffset = new Phaser.Point(10, 8);
var defaultHp = 50;
var laserDamage = 5;
var groundPoundDamage = 20;
var live = false;
var updateRate = 200;
var shooted = false;
var shootCoords = {};
var hasDamaged = [];
var tellThatImConnected = 2000;
var tellThatImConnectedTimer = 0;
var checkThatPlayersAreAlive = 6000;
var checkThatPlayersAreAliveTimer = 0;
var checkedVitality = false;
function GameRoundNoMonsterState() {}
GameRoundNoMonsterState.prototype = {
    init: function(initData) {
        self = this;
        self.initData = initData;
        game.player = initData.player;
        game.player.hp = defaultHp;
        game.player.isAlive = true;
        playersToConnect = initData.players;
        room = {
            players: [],
            params: initData.params
        };
        lasers = [];
        nades = [];
        nadeCount = 3;
        checkedVitality = false;

        if(room.params.rules.id == 'TM') {
            room.params.teams.blue.forEach(function(i) {
                if(i == game.player.id)
                    currentTeam = 'blue';
            });
            room.params.teams.red.forEach(function(i) {
                if(i == game.player.id)
                    currentTeam = 'red';
            });
        }

        roomIdGameUpdates = kuzzle.subscribe('kf-room-1', {"term": {"roomId": game.player.rid.toLowerCase()}}, function (dataGameUpdate) {
            if (dataGameUpdate.body.pid != game.player.id && game.state.current == 'game-round-no-monster') {
                self.updateFromKuzzle(dataGameUpdate.body);
            }
        });
        live = true;
        gameState = "STARTED";
    },
    preload: function() {
        game.load.image('player', 'assets/sprites/game-round/player.png');
        game.load.image('smoke-particle', 'assets/sprites/game-round/smoke.png');
        game.load.image('blood-particle', 'assets/sprites/game-round/blood-particle.png');
        game.load.image('laser', 'assets/sprites/game-round/laser.png');
        game.load.image('nade', 'assets/sprites/game-round/nade.png');
        game.load.image('explosion-fire', 'assets/sprites/game-round/explosion-fire.png');
        game.load.image('explosion-smoke', 'assets/sprites/game-round/explosion-smoke.png');
        game.load.image('city-bg', 'assets/sprites/game-round/background-city.png');
        game.load.image('kuzzle-bg', 'assets/sprites/game-round/background-kuzzle.png');
        game.load.image('glitch-bg', 'assets/sprites/game-round/background-glitch.png');

        game.load.tilemap('city-map', 'assets/maps/city.csv', null, Phaser.Tilemap.CSV);
        game.load.image('tiles-city', 'assets/sprites/game-round/tiles-city.png');

        game.load.tilemap('kuzzle-map', 'assets/maps/kuzzle.csv', null, Phaser.Tilemap.CSV);
        game.load.image('tiles-kuzzle', 'assets/sprites/game-round/tiles-kuzzle.png');

        game.load.tilemap('glitch-map', 'assets/maps/glitch.csv', null, Phaser.Tilemap.CSV);
        game.load.image('tiles-glitch', 'assets/sprites/game-round/tiles-glitch.png');

        game.load.spritesheet('pierre', 'assets/sprites/game-round/pierre.png', 42, 102, 4);
        game.load.spritesheet('gilles', 'assets/sprites/game-round/gilles.png', 42, 102, 4);

        game.load.audio('groundpound', 'assets/sounds/groundpound.wav');
        game.load.audio('nade-countdown', 'assets/sounds/nade-countdown.wav');
        game.load.audio('nade', 'assets/sounds/nade.wav');
        game.load.audio('footstep', 'assets/sounds/footstep.wav');
        game.load.audio('start-game', 'assets/sounds/start-game.wav');
        game.load.audio('laser1', 'assets/sounds/laser1.wav');
        game.load.audio('laser2', 'assets/sounds/laser2.wav');
        game.load.audio('yeah', 'assets/sounds/yeah.mp3');

        game.time.advancedTiming = true;
    },
    create: function() {
        audioGroundpound = game.add.audio('groundpound');
        audioNadeCountdown = game.add.audio('nade-countdown');
        audioNade = game.add.audio('nade');
        audioFootstep = game.add.audio('footstep');
        audioStartGame = game.add.audio('start-game');
        audioLaser1 = game.add.audio('laser1');
        audioLaser2 = game.add.audio('laser2');
        audioYeah = game.add.audio('yeah');

        musicGameRound = gameMusics[room.params.level.id];
        if(this.game.hasMusic) musicGameRound.play();

        audioStartGame.play();

        filterPixelate6      = new PIXI.PixelateFilter();
        filterPixelate6.size = {x: 6, y: 6};
        filterPixelate3      = new PIXI.PixelateFilter();
        filterPixelate3.size = {x: 3, y: 3};

        game.world.setBounds(0, 0, 400, 200);

        if(room.params.level.id == 'CITY')
            background = game.add.sprite(320, 180, 'city-bg');
        if(room.params.level.id == 'KUZZLE')
            background = game.add.sprite(320, 180, 'kuzzle-bg');
        if(room.params.level.id == 'GLITCH')
            background = game.add.sprite(320, 180, 'glitch-bg');

        game.renderer.renderSession.roundPixels = true;
        game.stage.backgroundColor = 0x444444;

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.gravity.y = 1000;

        playerShadow = self.addPlayerShadow(game.player.look);
        player       = self.addPlayer(game.player.id, game.player.look);
        emitter      = self.addPlayerEmitter();
        hpMeter      = self.addPlayerHPMeter();
        tag          = self.addPlayerTag(game.player.username);
        blood        = self.addPlayerBlood();
        //game.camera.follow(player);

        if(room.params.level.id == 'CITY') {
            map = game.add.tilemap('city-map', 20, 20);
            map.addTilesetImage('tiles-city');
        }
        if(room.params.level.id == 'KUZZLE') {
            map = game.add.tilemap('kuzzle-map', 20, 20);
            map.addTilesetImage('tiles-kuzzle');
        }
        if(room.params.level.id == 'GLITCH') {
            map = game.add.tilemap('glitch-map', 20, 20);
            map.addTilesetImage('tiles-glitch');
        }
        map.setCollisionBetween(0, 2000);
        layer = map.createLayer(0);
        layer.resizeWorld();

        deathMessage         = game.add.bitmapText(10, 100, 'font', 'Monster Kill', 48);
        deathMessage.alpha   = 0.0;
        deathMessage.filters = [filterPixelate3];
        deathMessage.anchor.setTo(0.5, 0.5);

        gameOverMessage = game.add.bitmapText(300, 150, 'font', 'Game Over', 28);
        gameOverMessage.alpha   = 0.0;
        gameOverMessage.filters = [filterPixelate3];
        gameOverMessage.anchor.setTo(0.5, 0.5);
        gameOverMessage.fixedToCamera = true;

        cursors    = game.input.keyboard.createCursorKeys();
        jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        fireButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        nadeButton = game.input.keyboard.addKey(Phaser.Keyboard.G);

        self.game.input.onDown.add(self.fullScreen, self);

        self.enterKey      = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        self.fullscreenKey = this.game.input.keyboard.addKey(Phaser.Keyboard.F);
        self.quitKey       = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
        self.enterKey.onDown.add(self.switchKuzzleSynch, self);
        self.fullscreenKey.onDown.add(self.fullScreen, self);
        self.quitKey.onDown.add(self.quitGame, self);

        playersToConnect.forEach(function(p) {
            if(p.id != game.player.id) {
                self.handleConnect(p);
            }
        });

        blurSprite = game.add.sprite(0, 0);
        blurSprite.width = game.width;
        blurSprite.height = game.height;
        blurSprite.color = 0xFFFFFF;
        blurSprite.alpha = 0.0;
        blurX = game.add.filter('BlurX');
        blurY = game.add.filter('BlurY');
        blurSprite.filters = [blurX, blurY];

        if(room.params.level.id == 'GLITCH') {
            nfilter = new PIXI.AsciiFilter();
            nfilter.size = 8;
        }
        if(room.params.level.id == 'KUZZLE') {
            nfilter = game.add.filter('Vignette', 320, 180);
            nfilter.size = 0.3;
            nfilter.amount = 0.5;
            nfilter.alpha = 1.0;
        }
    },
    switchKuzzleSynch: function() {
        live = !live;
    },
    addPlayer: function(id, look) {
        var p = game.add.sprite(Math.floor((Math.random() * (game.world.width - 200)) + 200), game.world.centerY, look);
        p.animations.add('idle', [0, 1], 2, true);
        p.animations.add('run', [2, 3], 3, true);
        game.physics.enable(p, Phaser.Physics.ARCADE);
        //p.filters = [filterPixelate6];
        //.blendMode = PIXI.blendModes.ADD;
        p.body.collideWorldBounds = true;
        p.body.bounce.setTo(0.4, 0.4);
        p.body.linearDamping = 1;
        p.anchor.setTo(0.5, 1.0);
        p.hp = defaultHp;
        p.height = 102;
        //p.width = 64;
        p.width = 42;
        p.id = id;
        p.animations.play('idle');
        //p.scale.set(1.5);

        return p;
    },
    addPlayerShadow: function(look) {
        var ps = game.add.sprite(game.world.centerX, game.world.centerY, look);
        ps.animations.add('idle', [0, 1], 2, true);
        ps.animations.add('run', [2, 3], 3, true);
        ps.anchor.setTo(0.5, 1.0);
        ps.tint = 0x000000;
        ps.alpha = 0.5;
        ps.height = 102;
        ps.width = 42;
        ps.play('idle');

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
        room.players.forEach(function(e) {
            if(e.id == data.pid) {
                e.sprite.x = data.x;
                e.sprite.y = data.y;
                e.sprite.body.velocity.x = data.vx;
                e.sprite.body.velocity.y = data.vy;
                e.emitter.on = data.emits;
                if(data.damaged.length > 0) {
                    data.damaged.forEach(function(d) {
                        if(d.id == game.player.id) {
                            self.iTakeDamage(e, d.dmg);
                        } else {
                            self.playerTakesDamage(getPlayerById(d.id), d.dmg, false);
                        }
                    });
                }
                if(data.shoot) {
                    if(data.shoot.type == 'laser')
                        self.spawnLaser(e, data.shoot.x, data.shoot.y);
                    if(data.shoot.type == 'nade')
                        self.spawnNade(e, data.shoot.x, data.shoot.y);
                }
                e.going = e.sprite.body.velocity.x == 0 ? 'nowhere' : e.sprite.body.velocity.x > 0 ? 'right' : 'left';
                if(typeof e.wasGoing != "undefined") {
                    e.changedDirection = e.going != e.wasGoing;
                } else {
                    e.wasGoing = 'right';
                }
                if(e.going != 'nowhere')
                    e.wasGoing = e.going;
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

        if(typeof lastPlayerCoordsX == "undefined") {
            lastPlayerCoordsX = player.x;
        }
        if(typeof lastPlayerCoordsY == "undefined") {
            lastPlayerCoordsY = player.y;
        }

        if(game.time.now > updateTimer && live && ((player.x != lastPlayerCoordsX || player.y != lastPlayerCoordsY) || shooted || hasDamaged.length > 0)) {
            updateTimer = game.time.now + updateRate;
            kuzzle.create("kf-room-1", {
                roomId   : game.player.rid.toLowerCase(),
                pid      : game.player.id,
                look     : game.player.look,
                username : game.player.username,
                hp       : game.player.hp,
                x        : player.x,
                y        : player.y,
                vx       : player.body.velocity.x,
                vy       : player.body.velocity.y,
                emits    : emitter.on,
                shoot    : shooted ? shootCoords : false,
                damaged  : hasDamaged,
                alive    : game.player.isAlive
            }, false, function(r) { /*console.log(r);*/ });
            if(hasDamaged.length > 0) {
                hasDamaged = [];
            }
            if(shooted) shooted = false;
            lastPlayerCoordsX = player.x;
            lastPlayerCoordsY = player.y;
        }

        if(game.time.now > tellThatImConnectedTimer) {
            tellThatImConnectedTimer = game.time.now + tellThatImConnected;
            kuzzle.update('kf-users', {_id: game.player.id, kflastconnected: game.time.now}, function() {
            });
            room.players.forEach(function(p) {
               if(p.id != game.player.id) {
                   p.kfconnected = p.kfconnected + tellThatImConnected;
               }
            });
        }

        if(game.time.now > checkThatPlayersAreAliveTimer) {
            checkThatPlayersAreAliveTimer = game.time.now + checkThatPlayersAreAlive;
            var filterConnected = {
                "filter": {
                    "term": {
                        "roomId": game.player.rid.toLowerCase().replace("-", "")
                    }
                }
            };
            kuzzle.search('kf-users', filterConnected, function(response) {
                response.result.hits.hits.forEach(function(e, i) {
                    if(e._id != game.player.id) {
                        room.players.forEach(function (p) {
                            if(p.id == e._id && (p.kfconnected - p.kflastconnected > 6000)) {
                                self.handleDisconnect(p);
                                kuzzle.delete('kf-users', p.id, function() { });
                            }
                        });
                    }
                });
            });
        }

        if(typeof background != "undefined" && room.params.level.id == 'GLITCH' || room.params.level.id == 'KUZZLE') {
            background.filters = [nfilter];
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

        if(room.params.rules.id == 'TM') {
            if(currentTeam == 'blue')
                tag.tint = 0x0000FF;
            else
                tag.tint = 0xFF0000;
        }

        room.players.forEach(function(p) {
            var px = p.sprite.x;
            var py = p.sprite.y;
            p.shadow.x   = px + shadowOffset.x;
            p.shadow.y   = py + shadowOffset.y;
            p.hpMeter.x  = px + shadowOffset.x - (p.sprite.width + 20);
            p.hpMeter.y  = py + shadowOffset.y - (p.sprite.height + 40);
            p.tag.x      = px - (p.sprite.width - 35);
            p.tag.y      = py - (p.sprite.height + 30);
            p.blood.x    = px;
            p.blood.y    = py;
            if(p.hp <= 0) {
                game.physics.arcade.collide(player, p.blood);
                room.players.forEach(function(pb) {
                    game.physics.arcade.collide(pb, p.blood);
                });
            }
            p.emitter.emitX = px;
            p.emitter.emitY = py;
            if(typeof p.going != "undefined") {
                if(p.going == 'right') {
                    p.sprite.animations.play('run');
                    p.shadow.animations.play('run');
                    game.add.tween(p.sprite.scale).to({x: 1.0}, 75, Phaser.Easing.Bounce.Out, true);
                    game.add.tween(p.shadow.scale).to({x: 1.0}, 75, Phaser.Easing.Bounce.Out, true);
                    p.changedDirection = false;
                    p.sprite.body.velocity.x = p.sprite.body.velocity.x - 10.0;
                } else if(p.going == 'left') {
                    p.sprite.animations.play('run');
                    p.shadow.animations.play('run');
                    game.add.tween(p.sprite.scale).to({x: -1.0}, 75, Phaser.Easing.Bounce.Out, true);
                    game.add.tween(p.shadow.scale).to({x: -1.0}, 75, Phaser.Easing.Bounce.Out, true);
                    p.changedDirection = false;
                    p.sprite.body.velocity.x = p.sprite.body.velocity.x + 10.0;
                } else {
                    p.sprite.animations.play('idle');
                    p.shadow.animations.play('idle');
                }
            }
            if(room.params.rules.id == 'TM') {
                if(p.team == 'blue')
                    p.tag.tint = 0x0000FF;
                else
                    p.tag.tint = 0xFF0000;
            }
            game.physics.arcade.collide(p.sprite, layer);
        });

        if (cursors.left.isDown) {
            player.body.velocity.x = -300;
        }
        if(cursors.right.isDown) {
            player.body.velocity.x = 300;
        }
        if(player.body.velocity.x < 10.0 && player.body.velocity.x > -10.0) {
            player.body.velocity.x = 0.0;
        }
        if(player.body.velocity.x > 0.0) {
            player.play('run');
            playerShadow.play('run');
            direction = 'right';
            player.body.velocity.x = player.body.velocity.x - 10.0;
            game.add.tween(player.scale).to({x: 1.0}, 75, Phaser.Easing.Bounce.Out, true);
            game.add.tween(playerShadow.scale).to({x: 1.0}, 75, Phaser.Easing.Bounce.Out, true);
        } else if(player.body.velocity.x < 0.0) {
            player.play('run');
            playerShadow.play('run');
            direction = 'left';
            player.body.velocity.x = player.body.velocity.x + 10.0;
            game.add.tween(player.scale).to({x: -1.0}, 75, Phaser.Easing.Bounce.Out, true);
            game.add.tween(playerShadow.scale).to({x: -1.0}, 75, Phaser.Easing.Bounce.Out, true);
        } else {
            player.play('idle');
            playerShadow.play('idle');
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
            audioGroundpound.play();
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
        }

        if(nadeButton.isDown && nadeCount > 0 && game.time.now > nadeTimer) {
            nadeCount -= 1;
            nadeTimer = game.time.now + nadeRecover;
            this.throwNade();
        }

        lasers.forEach(function(l, i) {
            room.players.forEach(function(p) {
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
        room.players.forEach(function(p) {
            if(p.id != game.player.id) {
                game.physics.arcade.collide(player, p.sprite, self.handleCollisionBetweenPlayers, null, self);
            }
        });
        nades.forEach(function(n, i) {
            n.body.velocity.x -= n.body.velocity.x > 0 ? 4 : -4;
            n.timer -= 10;
            game.physics.arcade.collide(n, layer);
            room.players.forEach(function(p) {
                game.physics.arcade.collide(n, p);
            });
            if(n.timer <= 0) {
                audioNade.play();
                if(n.owner == game.player.id) {
                    if(game.physics.arcade.distanceBetween(n, player) < 250 && game.player.isAlive) {
                        var dmg = Math.floor(Math.sin(((250 - game.physics.arcade.distanceBetween(n, player)) / 250) * (Math.PI / 2)) * defaultHp);
                        hasDamaged.push({
                            id: game.player.id,
                            dmg: dmg
                        });
                        self.iTakeDamage(game.player, dmg);
                    }
                    room.players.forEach(function(p) {
                        if(game.physics.arcade.distanceBetween(n, p.sprite) < 250 && p.isAlive) {
                            var dmg = Math.floor(Math.sin(((250 - game.physics.arcade.distanceBetween(n, p.sprite)) / 250) * (Math.PI / 2)) * defaultHp);
                            hasDamaged.push({
                                id: p.id,
                                dmg: dmg
                            });
                            self.playerTakesDamage(p, dmg, true);
                        }
                    });
                }
                game.juicy.shake(60, 200);
                self.tweenTint(n, 0x333333, 0xFF11FF, 1000);
                var o = n.owner;
                explosion = game.add.emitter(game.world.centerX, game.world.centerY, 400);
                explosion.emitX = n.x;
                explosion.emitY = n.y - 10;
                explosion.setScale(0.2, 2.0, 0.2, 2.0, 500, Phaser.Easing.Elastic.Out);
                explosion.filters = [filterPixelate3];
                explosion.makeParticles(['explosion-fire', 'explosion-smoke'], 0, 1000, true, true);
                explosion.setAlpha(1, 0, 1000);
                explosion.setXSpeed(-1000, 1000);
                explosion.setYSpeed(-100, -2000);
                explosion.bounce.setTo(0.2, 0.2);
                //explosion.angularDrag = 30;
                //explosion.gravity = -100;
                explosion.start(false, 1000, 2);
                nadeFadeOut = game.add.tween(n).to({alpha: 0.0}, 1000, 'Linear', true);
                nadeFadeOut.onComplete.add(function() {
                    explosion.on = false;
                    //explosion.destroy();
                    //n.destroy();
                });
                nades.splice(i, 1);
            }
        });
    },
    shootLaser: function() {
        audioLaser1.play();
        var posX = direction == 'right' ? player.x : player.x - 80;
        var laser = game.add.sprite(posX, player.y - 80, 'laser');
        game.physics.enable(laser, Phaser.Physics.ARCADE);
        laser.events.onOutOfBounds.add(self.destroyLaser, self);
        laser.width = 80;
        laser.height = 50;
        laser.checkWorldBounds = true;
        laser.outOfBoundsKill = true;
        laser.body.gravity.y = -1000;
        laser.tint = Phaser.Color.getRandomColor(100, 255);
        laser.blendMode = PIXI.blendModes.ADD;
        laser.touched = false;
        laser.owner = game.player.id;
        shooted = true;
        shootCoords = {x: posX, y: player.y - 50, type: 'laser'};

        if(direction == 'right')
            laser.body.velocity.x = 1200;
        if(direction == 'left')
            laser.body.velocity.x = -1200;
        lasers.push(laser);
    },
    spawnLaser: function(owner, x, y) {
        audioLaser2.play();
        var vx = 1200;
        var posX = x;
        if(owner.going == 'right') {
            //posX = owner.sprite.x;
            vx = 1200;
        } else if(owner.going == 'left') {
            //posX = owner.sprite.x - 80;
            vx = -1200;
        } else {
            //posX = (owner.wasGoing == 'right' ? owner.sprite.x : owner.sprite.x - 80);
            vx = (owner.wasGoing == 'right' ? 1200 : -1200);
        }
        var laser = game.add.sprite(posX, /*owner.sprite.y - 80*/y, 'laser');
        game.physics.enable(laser, Phaser.Physics.ARCADE);
        laser.events.onOutOfBounds.add(self.destroyLaser, self);
        laser.width = 80;
        laser.height = 50;
        laser.checkWorldBounds = true;
        laser.body.gravity.y = -1000;
        laser.tint = Phaser.Color.getRandomColor(100, 255);
        laser.blendMode = PIXI.blendModes.ADD;
        laser.touched = false;
        laser.owner = owner.id;
        laser.body.velocity.x = vx;
        lasers.push(laser);
    },
    destroyLaser: function(laser) {
        laser.kill();
        laser.destroy();
    },
    throwNade: function() {
        audioNadeCountdown.play();
        var posX = direction == 'right' ? player.x : player.x - 80;
        var nade = game.add.sprite(posX, player.y - 80, 'nade');
        game.physics.enable(nade, Phaser.Physics.ARCADE);
        nade.body.collideWorldBounds = true;
        nade.owner = game.player.id;
        nade.width = 20;
        nade.height = 24;
        shooted = true;
        shootCoords = {x: posX, y: player.y - 80, type: 'nade'};
        nade.timer = 2000;
        nade.body.drag = 100;
        nade.body.gravity.y = 1000;
        nade.body.bounce.setTo(0.4, 0.4);
        nade.anchor.setTo(0.5, 0.5);
        nade.body.angularVelocity = 400;
        nade.smoothed = false;

        var tweenNadeScale = game.add.tween(nade.scale).to({x: 3.0, y: 3.0}, 200, 'Linear', true, 0, -1);
        tweenNadeScale.yoyo(true, 0);

        if(direction == 'right')
            nade.body.velocity.x = 500;
        if(direction == 'left')
            nade.body.velocity.x = -500;
        nade.body.velocity.y = -1000;
        nades.push(nade);
    },
    spawnNade: function(owner, x, y) {
        audioNadeCountdown.play();
        var vx = 500;
        if(owner.going == 'right')
            vx = 500;
        else if(owner.going == 'left')
            vx = -500;
        else
            vx = (owner.wasGoing == 'right' ? 500 : -500);
        var nade = game.add.sprite(x, y, 'nade');
        game.physics.enable(nade, Phaser.Physics.ARCADE);
        nade.body.collideWorldBounds = true;
        nade.owner = owner.id;
        nade.width = 20;
        nade.height = 24;
        nade.timer = 2000;
        nade.body.drag = 100;
        nade.body.gravity.y = 1000;
        nade.body.bounce.setTo(0.4, 0.4);
        nade.anchor.setTo(0.5, 0.5);
        nade.body.angularVelocity = 400;

        var tweenNadeScale = game.add.tween(nade.scale).to({x: 3.0, y: 3.0}, 200, 'Linear', true, 0, -1);
        tweenNadeScale.yoyo(true, 0);

        nade.body.velocity.x = vx;
        nade.body.velocity.y = -1000;
        nades.push(nade);
    },
    handleCollisionBetweenPlayers: function(p, e) {
        if(groundPounding && flying) {
            audioGroundpound.play();
            enemy = getPlayerById(e.id);
            game.juicy.shake(30, 60);
            flying = false;
            hasDamaged.push({id: enemy.id, dmg: groundPoundDamage});
            self.playerTakesDamage(enemy, groundPoundDamage, true);
        }
    },
    handleCollisionBetweenLasersAndEnemies: function(l, p) {
        if(l.owner == game.player.id) {
            hasDamaged.push({id: p.id, dmg: laserDamage});
            self.playerTakesDamage(getPlayerById(p.id), laserDamage, true);
        }
    },
    playerTakesDamage: function(p, dmg, iKilled) {
        self.tweenTint(p.sprite, 0x333333, 0xFF11FF, 100);
        p.hp -= dmg;
        p.hpMeter.text = p.hp;
        p.hpMeter.tint = Phaser.Color.interpolateColor(0xFF0000, 0xFFFFFF, defaultHp, p.hp);
        if(p.hp <= 0) {
            self.playerDies(p, iKilled);
        }
    },
    iTakeDamage: function(enemy, dmg) {
        self.tweenTint(player, 0x333333, 0xFF11FF, 100);
        game.player.hp -= dmg;
        hpMeter.text = game.player.hp;
        hpMeter.tint = Phaser.Color.interpolateColor(0xFF0000, 0xFFFFFF, defaultHp, game.player.hp);
        if(game.player.hp <= 0) {
            self.iDie(enemy);
        }
    },
    playerDies: function(p, iKilled) {
        p.sprite.body.enable = false;
        p.isAlive = false;
        p.blood.start(false, 1500, 2);
        p.blood.filters = [filterPixelate3];
        p.hpMeter.destroy();
        p.tag.destroy();
        var dieAnimation = game.add.tween(p.sprite).to({alpha: 0.0}, 500, 'Linear').start();
        game.add.tween(p.shadow).to({alpha: 0.0}, 500, 'Linear').start();
        dieAnimation.onComplete.add(function() {
            p.shadow.destroy();
            p.blood.on = false;
            if(iKilled) {
                audioYeah.play();
                var messages = ["Monster Kill", "Yeaaaaahhh!!", "Stay down!!", "Awesome :D", "Niiiiice!!", "Time to\nKick ass!"];
                deathMessage.text = messages[Math.floor(Math.random() * messages.length)];
                game.add.tween(deathMessage.scale).to({x: 2.0, y: 2.0}, 1500, 'Elastic', true);
                game.add.tween(deathMessage).to({angle: 350.0}, 1500, 'Elastic', true);
                var deathMessageIn = game.add.tween(deathMessage).to({alpha: 1.0}, 1500, Phaser.Easing.Exponential.Out, true);
                deathMessageIn.onComplete.add(function () {
                    game.add.tween(deathMessage).to({alpha: 0.0}, 500, 'Elastic', true);
                });
            }
        });
        if(game.player.isMaster) {
            self.checkForRoundEnd();
        }
    },
    iDie: function(enemy) {
        player.body.enable = false;
        game.player.isAlive = false;
        blood.start(false, 1500, 2);
        blood.filters = [filterPixelate3];
        hpMeter.destroy();
        tag.destroy();
        var dieAnimation = game.add.tween(player).to({alpha: 0.0}, 500, 'Linear').start();
        game.add.tween(playerShadow).to({alpha: 0.0}, 500, 'Linear').start();
        dieAnimation.onComplete.add(function() {
            playerShadow.destroy();
            blood.on = false;
            if(enemy.id == game.player.id) {
                var messages = ["You killed yourself\nstupid idiot..\nGame Over!"];
            } else {
                var messages = ["You have been detroyed\nby" + enemy.username + "\nGame Over!"];
            }
            gameOverMessage.text = messages[Math.floor(Math.random() * messages.length)];
            game.add.tween(gameOverMessage.scale).to({x: 2.0, y: 2.0}, 1500, 'Elastic', true);
            game.add.tween(gameOverMessage).to({angle: 350.0}, 1500, 'Elastic', true);
            game.add.tween(gameOverMessage).to({alpha: 1.0}, 1500, Phaser.Easing.Exponential.Out, true);
        });
        //game.camera.follow(enemy.sprite);
        if(game.player.isMaster) {
            self.checkForRoundEnd();
        }
    },
    checkForRoundEnd: function() {
        var playersAlive = [];
        var w = null;
        room.players.forEach(function(p) {
            if(p.isAlive)
                playersAlive.push(p.id);
        });
        switch(room.params.rules.id) {
            case 'FFA':
                if(playersAlive.length == 0 && game.player.isAlive) {
                    w = game.player.id;
                }
                if(playersAlive.length == 1 && !game.player.isAlive) {
                    w = playersAlive[0];
                }
                break;
            case 'TM':
                var _b = 0;
                var _r = 0;
                if(currentTeam == 'blue')
                    _b += 1;
                if(currentTeam == 'red')
                    _r += 1;
                room.players.forEach(function(p) {
                    if(p.team == 'blue') {
                        _b += 1;
                    }
                    if(p.team == 'red') {
                        _r += 1;
                    }
                });
                room.players.forEach(function(p) {
                    if(p.team == 'blue' && !p.isAlive) {
                        _b -= 1;
                    }
                    if(p.team == 'red' && !p.isAlive) {
                        _r -= 1;
                    }
                });
                if(!game.player.isAlive) {
                    if(currentTeam == 'blue')
                        _b -= 1;
                    if(currentTeam == 'red')
                        _r -= 1;
                }
                if(_b == 0 && _r > 0)
                    w = 'red';
                if(_r == 0 && _b > 0)
                    w = 'blue';
                break;
        }
        if(w != null) {
            room.ending = {
                winners: w
            };
            var updateQuery = {
                _id: game.player.rid,
                ending: room.ending
            };
            setTimeout(function() {
                kuzzle.update('kf-rooms', updateQuery, function () {
                    console.log('Pushed new game round rules to other players');
                    self.prepareToGameEnd();
                });
            }, 2000);
        }
    },
    prepareToGameEnd: function() {
        game.add.tween(blurSprite).to({alpha: 0.5}, 2000, 'Linear').start();
        musicGameRound.stop();
        game.stateTransition.to('game-end', true, false, room);
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
    handleConnect: function(p) {
        console.log('Player connected: ' + p.username);
        var newPlayer = {
            id             : p.id,
            look           : p.look,
            kflastconnected: 0,
            kfconnected    : 0,
            username       : p.username,
            isAlive        : true,
            color          : p.color,
            hp             : defaultHp,
            shadow         : this.addPlayerShadow(p.look),
            sprite         : this.addPlayer(p.id, p.look),
            emitter        : this.addPlayerEmitter(),
            hpMeter        : this.addPlayerHPMeter(),
            tag            : this.addPlayerTag(p.username),
            blood          : this.addPlayerBlood(),
            x              : 0.0,
            y              : 0.0,
            vx             : 0.0,
            vy             : 0.0,
            team           : null
        };

        if(room.params.rules.id == 'TM') {
            room.params.teams.blue.forEach(function(i) {
                if(i == p.id)
                    newPlayer.team = 'blue';
            });
            room.params.teams.red.forEach(function(i) {
                if(i == p.id)
                    newPlayer.team = 'red';
            });
        }

        //newPlayer.sprite.tint = newPlayer.color;
        room.players.push(newPlayer);
    },
    handleDisconnect: function(p) {
        console.log('Player disconnected: ' + p.username);
        room.players.forEach(function(e, i) {
            if(e.id == p.id) {
                e.sprite.body.enable = false;
                e.sprite.kill();
                e.sprite.destroy();
                e.shadow.kill();
                e.shadow.destroy();
                e.hpMeter.kill();
                e.hpMeter.destroy();
                e.tag.kill();
                e.tag.destroy();
                room.players.splice(i, 1);
            }
        });
        if(room.players.length + 1 < game.minimumPlayersPerRoom) {
            kuzzle.unsubscribe(roomIdPlayers);
            kuzzle.unsubscribe(roomIdGameUpdates);
            kuzzle.unsubscribe(roomIdRoom);
            var roomUpdateQuery = {
                _id: game.player.rid,
                connectedPlayers: 0
            };
            kuzzle.update('kf-rooms', roomUpdateQuery, function() {
                console.log('Updated connected player count for current room (' + room.players.length + ' players remaining)');
                kuzzle.delete('kf-users', game.player.id, function() {
                    console.log('All done!');
                    musicGameRound.stop();
                    game.stateTransition.to('not-enough-players');
                });
            });
        }
    },
    quitGame: function() {
        console.log('Disconnecting..');
        kuzzle.unsubscribe(roomIdPlayers);
        kuzzle.unsubscribe(roomIdGameUpdates);
        kuzzle.unsubscribe(roomIdRoom);
        var roomUpdateQuery = {
            _id: game.player.rid,
            connectedPlayers: room.players.length
        };
        if(game.player.isMaster && room.players.length > 0) {
            console.log('You were master, now electing a new master');
            roomUpdateQuery.master = room.players[0].id;
        }
        kuzzle.update('kf-rooms', roomUpdateQuery, function() {
            console.log('Updated connected player count for current room (' + room.players.length + ' players remaining)');
            kuzzle.delete('kf-users', game.player.id, function() {
                console.log('All done!');
                musicGameRound.stop();
                game.state.start('main-menu', true, false);
            });
        });
    },
    render: function() {
        game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
    }
};