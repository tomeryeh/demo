function MainMenuState() {}
MainMenuState.prototype = {
    create: function() {
        self = this;
        fragmentSrc = [
            "precision mediump float;",
            "uniform float     time;",
            "uniform vec2      resolution;",
            "uniform vec2      mouse;",

            "const float Tau        = 6.2832;",
            "const float speed  = .025;",
            "const float density    = .02;",
            "const float shape  = .04;",

            "float random( vec2 seed ) {",
            "return fract(sin(seed.x+seed.y*1e3)*1e5);",
            "}",

            "float Cell(vec2 coord) {",
            "vec2 cell = fract(coord) * vec2(.5,2.) - vec2(.0,.0);",
            "return (1.-length(cell*2.-1.))*step(random(floor(coord)),density)*2.;",
            "}",

            "void main( void ) {",

            "vec2 p = gl_FragCoord.xy / resolution - vec2(.5,.5);",

            "float a = fract(atan(p.x, p.y) / Tau);",
            "float d = length(p);",

            "vec2 coord = vec2(pow(d, shape), a)*256.;",
            "vec2 delta = vec2(-time*speed*256., .5);",
            "//vec2 delta = vec2(-time*speed*256., cos(length(p)*10.)*2e0+time*5e-1); // wavy wavy",

            "float c = 0.;",
            "for(int i=0; i<3; i++) {",
            "coord += delta;",
            "c = max(c, Cell(coord));",
            "}",

            "gl_FragColor = vec4(c*d);",
            "}"
        ];
        filterMainMenu = new Phaser.Filter(game, null, fragmentSrc);
        filterMainMenu.setResolution(game.width, game.height);
        spriteMainMenu = game.add.sprite();
        spriteMainMenu.width = game.width;
        spriteMainMenu.height = game.height;
        spriteMainMenu.filters = [filterMainMenu];

        room = {
            players: [],
            joiningPlayers: []
        };

        game.stage.backgroundColor = 0x000000;

        musicMainMenu = game.add.audio('music-main-menu');
        musicMainMenu.loop = true;
        if(game.hasMusic) musicMainMenu.play();

        kuzzleTitle = game.add.sprite(320, 180, 'kuzzleTitle');
        kuzzleTitle.anchor.setTo(0.5, 1.25);
        game.add.tween(kuzzleTitle.scale).to({x: 1.18, y: 1.18}, 440, Phaser.Easing.Elastic.Out, true, 0, -1);

        filterPixelate3      = new PIXI.PixelateFilter();
        filterPixelate3.size = {x: 3, y: 3};
        tournament = game.add.bitmapText(425, 150, 'font', 'Tournament!!', 56);
        tournament.filters = [filterPixelate3];
        tournament.anchor.setTo(0.5, 0.5);
        game.add.tween(tournament.scale).to({x: 1.4, y: 1.4}, 440, Phaser.Easing.Elastic.Out, true, 0, -1);

        version = game.add.sprite(5, 340, 'version');
        version.scale.set(0.5, 0.5);

        menuItem = [
            {
                id: 'ONLINE_GAME',
                selected: true,
                spriteIdentifier: 'main-menu-online-game'
            },
            {
                id: 'OPTIONS',
                selected: false,
                spriteIdentifier: 'main-menu-options'
            },
            {
                id: 'CREDITS',
                selected: false,
                spriteIdentifier: 'main-menu-credits'
            }
        ];
        menuItem[0]['sprite'] = game.add.sprite(320, 180, 'main-menu-online-game-selected');
        menuItem[0]['sprite'].anchor.setTo(0.5, -0.5);

        menuItem[1]['sprite'] = game.add.sprite(320, 180, 'main-menu-options-unselected');
        menuItem[1]['sprite'].anchor.setTo(0.5, -1.5);

        menuItem[2]['sprite'] = game.add.sprite(320, 180, 'main-menu-credits-unselected');
        menuItem[2]['sprite'].anchor.setTo(0.5, -2.5);

        game.add.tween(menuItem[0].sprite).from( { y: 1200 }, 1000, Phaser.Easing.Quintic.Out).start();
        game.add.tween(menuItem[1].sprite).from( { y: 1200 }, 800, Phaser.Easing.Quintic.Out).delay(200).start();
        game.add.tween(menuItem[2].sprite).from( { y: 1200 }, 600, Phaser.Easing.Quintic.Out).delay(400).start();

        this.keyDown = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.keyDown.onDown.add(this.updateMenu, this);
        this.keyUp = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.keyUp.onDown.add(this.updateMenu, this);

        this.enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enterKey.onDown.add(this.selectMenuITem, this);

        menuItem[0]['sprite'].inputEnabled = true;
        menuItem[0]['sprite'].events.onInputDown.add(this.selectOnlineGame, this);
        menuItem[1]['sprite'].inputEnabled = true;
        menuItem[1]['sprite'].events.onInputDown.add(this.selectOptions, this);
        menuItem[2]['sprite'].inputEnabled = true;
        menuItem[2]['sprite'].events.onInputDown.add(this.selectCredits, this);
    },
    updateMenu: function(ev) {
        var selectedMenu = 0;
        nextMenu = ev.event.keyIdentifier == 'Down' ? 1 : -1;
        menuItem.forEach(function(e, i) {
            if(e.selected) {
                selectedMenu = typeof menuItem[i + (nextMenu)] === "undefined" ? ev.event.keyIdentifier == 'Down' ? 0 : 2 : i + (nextMenu);
            }
            e.selected = false;
            e.sprite.loadTexture(e.spriteIdentifier + '-unselected');
        });
        menuItem[selectedMenu].sprite.loadTexture(menuItem[selectedMenu].spriteIdentifier + '-selected');
        menuItem[selectedMenu].selected = true;
    },
    selectMenuITem: function() {
        switch(this.getSelectedMenu().id) {
            case 'ONLINE_GAME':
                this.selectOnlineGame();
                break;
            case 'OPTIONS':
                this.selectOptions();
                break;
            case 'CREDITS':
                this.selectCredits();
                break;
        }
    },
    selectOnlineGame: function() {
        musicMainMenu.stop();
        game.stateTransition.to('connecting');
    },
    selectOptions: function() {
        musicMainMenu.stop();
        game.stateTransition.to('options');
    },
    selectCredits: function() {
        musicMainMenu.stop();
        game.stateTransition.to('credits');
    },
    getSelectedMenu: function() {
        var selectedMenu = 0;
        menuItem.forEach(function(e, i) {
            if(e.selected) selectedMenu = i;
        });
        return menuItem[selectedMenu];
    },
    update: function() {
        filterMainMenu.update();
    }
};