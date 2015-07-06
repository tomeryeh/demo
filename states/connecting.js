function ConnectingState() {}
ConnectingState.prototype = {
    create: function() {
        name = null;

        musicConnecting = this.game.add.audio('music-lobby');
        if(this.game.hasMusic) musicConnecting.play();

        var fragmentSrc = [
            "precision mediump float;",
            "uniform float     time;",
            "uniform vec2      resolution;",
            "uniform vec2      mouse;",

            "const float Tau        = 6.2832;",
            "const float speed  = .2;",
            "const float density    = .02;",
            "const float shape  = .03;",

            "float random( vec2 seed ) {",
            "return fract(sin(seed.x+seed.y*1e3)*1e5);",
            "}",

            "float Cell(vec2 coord) {",
            "vec2 cell = fract(coord) * vec2(.5,2.) - vec2(.0,.5);",
            "return (1.-length(cell*2.-1.))*step(random(floor(coord)),density)*2.;",
            "}",

            "void main( void ) {",

            "vec2 p = gl_FragCoord.xy / resolution  - vec2(.5,.0);",

            "float a = fract(atan(p.x, p.y) / Tau);",
            "float d = length(p);",

            "vec2 coord = vec2(pow(d, shape), a)*256.;",
            "vec2 delta = vec2(-time*speed*256., .5);",
            "//vec2 delta = vec2(-time*speed*256., cos(length(p)*10.)*2e0+time*5e-1); // wavy wavy",

            "float c = 0.1;",
            "for(int i=0; i<3; i++) {",
            "coord += delta;",
            "c = max(c, Cell(coord));",
            "}",

            "gl_FragColor = vec4(c*d);",
            "}"
        ];
        filter = new Phaser.Filter(this.game, null, fragmentSrc);
        filter.setResolution(640, 360);
        sprite = this.game.add.sprite();
        sprite.width = 640;
        sprite.height = 360;
        sprite.tint = 0x00FFFF;
        var blurX = this.game.add.filter('BlurX');
        var blurY = this.game.add.filter('BlurY');
        sprite.filters = [filter/*, blurX, blurY*/];

        var kuzzleLogo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'kuzzle');
        kuzzleLogo.anchor.setTo(0.5, 1.25);
        this.game.add.tween(kuzzleLogo.scale).to({x: 6.0, y: 6.0}, 200, Phaser.Easing.Exponential.Out).start();
        kuzzleLogo.filters = [blurX, blurY];

        menuItem = [
            {
                id: 'OK',
                selected: true,
                spriteIdentifier: 'options-menu-fullscreen'
            },
            {
                id: 'BACK',
                selected: false,
                spriteIdentifier: 'options-menu-back'
            }
        ];

        menuItem[0]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'options-menu-fullscreen-selected');
        menuItem[0]['sprite'].anchor.setTo(0.5, -0.5);
        this.game.add.tween(menuItem[0]['sprite']).from({x: 1200}, 1200, Phaser.Easing.Quintic.Out).start();

        menuItem[1]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'options-menu-back-unselected');
        menuItem[1]['sprite'].anchor.setTo(0.5, -2.5);
        this.game.add.tween(menuItem[1]['sprite']).from({x: 1200}, 1200, Phaser.Easing.Quintic.Out).delay(200).start();

        this.game.kuzzle = new Kuzzle('http://api.uat.kuzzle.io:7512');
        kuzzleGame = this.game;
        kuzzleGame.name = "testMobile";

        this.keyDown = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.keyDown.onDown.add(this.updateMenu, this);
        this.keyUp = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.keyUp.onDown.add(this.updateMenu, this);

        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enterKey.onDown.add(this.selectMenuITem, this);

        this.enterName();

        menuItem[0]['sprite'].inputEnabled = true;
        menuItem[0]['sprite'].events.onInputDown.add(this.selectName, this);
        menuItem[1]['sprite'].inputEnabled = true;
        menuItem[1]['sprite'].events.onInputDown.add(this.selectBack, this);
    },
    connectToKuzzle: function() {
        connectText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "Connecting to Kuzzle..\n");
        connectText.font = 'Arial';
        connectText.fontWeight = 'bold';
        connectText.fontSize = 36;
        connectText.align = 'center';
        var grd = connectText.context.createLinearGradient(0, 0, 0, connectText.height);
        grd.addColorStop(0, '#8ED6FF');
        grd.addColorStop(1, '#004CB3');
        connectText.fill = grd;
        connectText.anchor.set(0.5, 1.0);
        connectText.alpha = 0.0;
        connectTextTweenOut = this.game.add.tween(connectText).to({alpha: 0.0}, 500).delay(1000);

        connectTextTweenOut.onComplete.addOnce(this.goToLobby, this);

        var connectTextTweenIn = this.game.add.tween(connectText).to({alpha: 1.0}, 500, Phaser.Easing.Exponential.Out).start();
        connectTextTweenIn.onComplete.addOnce(this.test, this);
    },
    goToLobby: function() {
        musicConnecting.stop();
        this.game.stateTransition.to('lobby', {playerName: kuzzleGame.name});
    },
    test: function() {
        var randColor = Phaser.Color.getRandomColor(0, 255);
        kuzzleGame.kuzzle.create("kf-user", {username: kuzzleGame.name, color: randColor}, true, function(createData) {
            connectText.setText("Connecting to Kuzzle..\nOK!");
            this.game.gameData.player = {'id':createData.result._id, 'name': kuzzleGame.name,color: randColor};
            roomId = kuzzleGame.kuzzle.subscribe('kf-user', {exists: {field: 'username'}}, function(data) {
                console.log(data);
                kuzzleGame.gameData.player.roomId = roomId;
                if(data.action == "create" && data._id != this.game.gameData.player.id) {
                    game.gameData.players.push({id: data._id, name: data.body.username, color: data.body.color});
                    var text = game.add.text(game.world.centerX, game.world.centerY, "- Awesome! -\nA new player joined:\n" + data.body.username);
                    text.font = 'Arial';
                    text.fontWeight = 'bold';
                    text.fontSize = 48;
                    text.align = 'center';
                    var grd = text.context.createLinearGradient(0, 0, 0, text.height);
                    grd.addColorStop(0, '#8ED6FF');
                    grd.addColorStop(1, '#004CB3');
                    text.fill = grd;
                    text.anchor.set(0.5);
                    text.alpha = 0.0;
                    var textTweenOut = game.add.tween(text).to({alpha: 0.0}, 1000).delay(3000);
                    game.add.tween(text).to({alpha: 1.0}, 1000, Phaser.Easing.Exponential.Out).start().chain(textTweenOut);
                    if(typeof self.handleConnect == 'function') {
                        self.handleConnect();
                    }
                }
                if(data.action == "delete") {
                    var deletedPlayer = getPlayerById(data._id);
                    console.log('deleted player:');
                    console.log(deletedPlayer);
                    var deletedUsername = deletedPlayer.name;
                    var text = game.add.text(game.world.centerX, game.world.centerY, "- Awww.. :( -\nA player left:\n" + deletedUsername);
                    var index = -1;
                    game.gameData.players.forEach(function(e, i) {
                       if(e.id == data._id) {
                           index = i;
                       }
                    });
                    if(index != -1) {
                        game.gameData.players.splice(index, 1);
                    }
                    console.log('player left:');
                    console.log(game.gameData.players);
                    text.font = 'Arial';
                    text.fontWeight = 'bold';
                    text.fontSize = 48;
                    text.align = 'center';
                    var grd = text.context.createLinearGradient(0, 0, 0, text.height);
                    grd.addColorStop(0, '#914D4D');
                    grd.addColorStop(1, '#823B3B');
                    text.fill = grd;
                    text.anchor.set(0.5);
                    text.alpha = 0.0;
                    var textTweenOut = game.add.tween(text).to({alpha: 0.0}, 1000).delay(3000);
                    game.add.tween(text).to({alpha: 1.0}, 1000, Phaser.Easing.Exponential.Out).start().chain(textTweenOut);
                    if(typeof self.handleDisconnect == 'function') {
                        self.handleDisconnect();
                    }
                }
            });
            connectTextTweenOut.start();
        });
    },
    enterName: function() {
        var nameText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "Enter your name:\n");
        nameText.font = 'Arial';
        nameText.fontWeight = 'bold';
        nameText.fontSize = 36;
        nameText.align = 'center';
        var grd = nameText.context.createLinearGradient(0, 0, 0, nameText.height);
        grd.addColorStop(0, '#8ED6FF');
        grd.addColorStop(1, '#004CB3');
        nameText.fill = grd;
        nameText.anchor.set(0.5, 1.0);
        nameText.alpha = 0.0;
        nameTextTweenOut = kuzzleGame.add.tween(nameText).to({alpha: 0.0}, 1000);
        kuzzleGame.add.tween(nameText).to({alpha: 1.0}, 1000, Phaser.Easing.Exponential.Out).start();
        this.game.input.keyboard.addCallbacks(this, null, null, function(char) {
            if(kuzzleGame.name == null) kuzzleGame.name = char; else kuzzleGame.name += char;
            nameText.setText("Enter your name:\n" + kuzzleGame.name);
        });
    },
    updateMenu: function(ev) {
        var selectedMenu = 0;
        nextMenu = ev.event.keyIdentifier == 'Down' ? 1 : -1;
        menuItem.forEach(function(e, i) {
            if(e.selected) {
                selectedMenu = typeof menuItem[i + (nextMenu)] === "undefined" ? ev.event.keyIdentifier == 'Down' ? 0 : 3 : i + (nextMenu);
            }
            e.selected = false;
            e.sprite.loadTexture(e.spriteIdentifier + '-unselected');
        });
        menuItem[selectedMenu].sprite.loadTexture(menuItem[selectedMenu].spriteIdentifier + '-selected');
        menuItem[selectedMenu].selected = true;
    },
    selectMenuITem: function() {
        switch(this.getSelectedMenu().id) {
            case 'OK':
                this.selectName();
                break;
            case 'BACK':
                this.selectBack();
                break;
        }
    },
    selectName: function() {
        nameTextTweenOut.start();
        this.connectToKuzzle();
    },
    selectBack: function() {
        musicConnecting.stop();
        this.game.stateTransition.to('main-menu');
    },
    getSelectedMenu: function() {
        var selectedMenu = 0;
        menuItem.forEach(function(e, i) {
            if(e.selected) selectedMenu = i;
        });
        return menuItem[selectedMenu];
    },
    update: function() {
        filter.update();
    }
};