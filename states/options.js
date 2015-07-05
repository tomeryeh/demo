function OptionsState() {}
OptionsState.prototype = {
    create: function() {
        var fragmentSrc = [
            "precision mediump float;",
            "uniform float     time;",
            "uniform vec2      resolution;",
            "uniform vec2      mouse;",

            "const float Tau        = 6.2832;",
            "const float speed  = .015;",
            "const float density    = .02;",
            "const float shape  = .04;",

            "float random( vec2 seed ) {",
            "return fract(sin(seed.x+seed.y*1e3)*1e5);",
            "}",

            "float Cell(vec2 coord) {",
            "vec2 cell = fract(coord) * vec2(.5,2.) - vec2(.0,.5);",
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

        musicOptions = this.game.add.audio('music-options');
        if(this.game.hasMusic) musicOptions.fadeIn();

        var kuzzle = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'kuzzle');
        kuzzle.anchor.setTo(0.5, 1.25);
        this.game.add.tween(kuzzle.scale).to({ x: 0.82, y: 0.82}, 980, Phaser.Easing.Elastic.Out, true, 0, -1);
        var blurX = this.game.add.filter('BlurX');
        var blurY = this.game.add.filter('BlurY');
        kuzzle.filters = [blurX, blurY];

        sprite.filters = [filter, blurX, blurY];

        menuItem = [
            {
                id: 'FULLSCREEN',
                selected: true,
                spriteIdentifier: 'options-menu-fullscreen'
            },
            {
                id: 'MUSIC',
                selected: false,
                spriteIdentifier: 'options-menu-music'
            },
            {
                id: 'SOUNDS',
                selected: false,
                spriteIdentifier: 'options-menu-sounds'
            },
            {
                id: 'BACK',
                selected: false,
                spriteIdentifier: 'options-menu-back'
            }
        ];
        menuItem[0]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'options-menu-fullscreen-selected');
        menuItem[0]['sprite'].anchor.setTo(0.5, 0.5);

        menuItem[1]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'options-menu-music-unselected');
        menuItem[1]['sprite'].anchor.setTo(0.5, -0.5);

        menuItem[2]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'options-menu-sounds-unselected');
        menuItem[2]['sprite'].anchor.setTo(0.5, -1.5);

        menuItem[3]['sprite'] = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'options-menu-back-unselected');
        menuItem[3]['sprite'].anchor.setTo(0.5, -2.5);

        this.game.add.tween(menuItem[0].sprite).from( { y: -1200 }, 1200, Phaser.Easing.Quintic.Out).start();
        this.game.add.tween(menuItem[1].sprite).from( { y: -1200 }, 1000, Phaser.Easing.Quintic.Out).delay(200).start();
        this.game.add.tween(menuItem[2].sprite).from( { y: -1200 }, 800, Phaser.Easing.Quintic.Out).delay(400).start();
        this.game.add.tween(menuItem[3].sprite).from( { y: -1200 }, 600, Phaser.Easing.Quintic.Out).delay(600).start();

        this.keyDown = this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        this.keyDown.onDown.add(this.updateMenu, this);
        this.keyUp = this.game.input.keyboard.addKey(Phaser.Keyboard.UP);
        this.keyUp.onDown.add(this.updateMenu, this);

        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enterKey.onDown.add(this.selectMenuITem, this);

        menuItem[0]['sprite'].inputEnabled = true;
        menuItem[0]['sprite'].events.onInputDown.add(this.selectFullscreen, this);
        menuItem[1]['sprite'].inputEnabled = true;
        menuItem[1]['sprite'].events.onInputDown.add(this.selectMusic, this);
        menuItem[2]['sprite'].inputEnabled = true;
        menuItem[2]['sprite'].events.onInputDown.add(this.selectSounds, this);
        menuItem[3]['sprite'].inputEnabled = true;
        menuItem[3]['sprite'].events.onInputDown.add(this.selectBack, this);
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
            case 'FULLSCREEN':
                this.selectFullscreen();
                break;
            case 'MUSIC':
                this.selectMusic();
                break;
            case 'BACK':
                this.selectBack();
                break;
        }
    },
    getSelectedMenu: function() {
        var selectedMenu = 0;
        menuItem.forEach(function(e, i) {
            if(e.selected) selectedMenu = i;
        });
        return menuItem[selectedMenu];
    },
    selectFullscreen: function() {
        if(!this.game.isFullScreen) {
            this.game.scale.startFullScreen();
            this.game.isFullScreen = true;
        } else {
            this.game.scale.stopFullScreen();
            this.game.isFullScreen = false;
        }
    },
    selectMusic: function() {
        if(!this.game.hasMusic) {
            musicOptions.play();
            this.game.hasMusic = true;
        } else {
            musicOptions.stop();
            this.game.hasMusic = false;
        }
    },
    selectSounds: function() {
    },
    selectBack: function() {
        musicOptions.stop();
        this.game.stateTransition.to('main-menu');
    },
    tweenTint: function(obj, startColor, endColor, time) {
        // create an object to tween with our step value at 0
        var colorBlend = {step: 0};

        // create the tween on this object and tween its step property to 100
        colorTween = this.game.add.tween(colorBlend).to({step: 100}, time, 'Linear', true, 0, -1);

        // run the interpolateColor function every time the tween updates, feeding it the
        // updated value of our tween each time, and set the result as our tint
        colorTween.onUpdateCallback(function() {
            obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
        });

        // set the object to the start color straight away
        obj.tint = startColor;

        // start the tween
        colorTween.start();
    },
    update: function() {
        filter.update();
    }
};