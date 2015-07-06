function MainMenuState() {}
MainMenuState.prototype = {
    create: function() {
        self = this;
        var fragmentSrc = [
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
        filter = new Phaser.Filter(this.game, null, fragmentSrc);
        filter.setResolution(640, 360);
        sprite = this.game.add.sprite();
        sprite.width = 640;
        sprite.height = 360;
        sprite.filters = [filter];

        musicMainMenu = this.game.add.audio('music-main-menu');
        if(this.game.hasMusic) musicMainMenu.play();

        var kuzzle = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'kuzzle');
        kuzzle.anchor.setTo(0.5, 1.25);
        this.game.add.tween(kuzzle.scale).to({ x: 1.18, y: 1.18}, 440, Phaser.Easing.Elastic.Out, true, 0, -1);

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
        menuItem[0]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'main-menu-online-game-selected');
        menuItem[0]['sprite'].anchor.setTo(0.5, -0.5);

        menuItem[1]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'main-menu-options-unselected');
        menuItem[1]['sprite'].anchor.setTo(0.5, -1.5);

        menuItem[2]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'main-menu-credits-unselected');
        menuItem[2]['sprite'].anchor.setTo(0.5, -2.5);

        this.game.add.tween(menuItem[0].sprite).from( { y: 1200 }, 1000, Phaser.Easing.Quintic.Out).start();
        this.game.add.tween(menuItem[1].sprite).from( { y: 1200 }, 800, Phaser.Easing.Quintic.Out).delay(200).start();
        this.game.add.tween(menuItem[2].sprite).from( { y: 1200 }, 600, Phaser.Easing.Quintic.Out).delay(400).start();

        this.keyDown = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.keyDown.onDown.add(this.updateMenu, this);
        this.keyUp = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.keyUp.onDown.add(this.updateMenu, this);

        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
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
        musicMainMenu.stop();
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
        this.game.stateTransition.to('connecting');
    },
    selectOptions: function() {
        this.game.stateTransition.to('options');
    },
    selectCredits: function() {
        this.game.stateTransition.to('credits');
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