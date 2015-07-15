function CreditsState() {}
CreditsState.prototype = {
    create: function() {
        self = this;
        var fragmentSrc = [
            "precision mediump float;",
            "uniform float     time;",
            "uniform vec2      resolution;",
            "uniform vec2      mouse;",

            "const float Tau        = 6.2832;",
            "const float speed  = .005;",
            "const float density    = .02;",
            "const float shape  = -.03;",

            "float random( vec2 seed ) {",
            "return fract(sin(seed.x+seed.y*1e3)*1e5);",
            "}",

            "float Cell(vec2 coord) {",
            "vec2 cell = fract(coord) * vec2(.5,2.) - vec2(.0,.5);",
            "return (1.-length(cell*2.-1.))*step(random(floor(coord)),density)*2.;",
            "}",

            "void main( void ) {",

            "vec2 p = gl_FragCoord.xy / resolution - vec2(.5,.7);",

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
        var blurX = this.game.add.filter('BlurX');
        var blurY = this.game.add.filter('BlurY');
        sprite.filters = [filter, blurX, blurY];

        musicCredits = this.game.add.audio('music-game');
        musicCredits.loop = true;
        if(this.game.hasMusic) musicCredits.play();

        var kuzzle = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'kuzzle');
        kuzzle.anchor.setTo(0.5, 1.25);
        this.game.add.tween(kuzzle.scale).to({x: 0.0, y: 0.0}, 2000, Phaser.Easing.Exponential.Out).start();
        kuzzle.filters = [blurX, blurY];

        var phaser2 = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'phaser2');
        phaser2.anchor.setTo(0.5, 0.75);
        phaser2.scale.setTo(0.5, 0.5);
        this.game.add.tween(phaser2).from({x: 1200.0}, 800, Phaser.Easing.Exponential.Out).delay(400).start();

        var back = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'options-menu-back-selected');
        back.anchor.setTo(0.5, -2.5);

        this.game.add.tween(back).from({x: 1200}, 1200, Phaser.Easing.Quintic.Out).start();

        this.enterKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        this.enterKey.onDown.add(this.backToMenu, this);

        //this.game.kuzzle.create("kf-user", {username: "James"}, false);

        back.inputEnabled = true;
        back.events.onInputDown.add(this.backToMenu, this);

        self = this;

        filterPixelate3      = new PIXI.PixelateFilter();
        filterPixelate3.size = {x: 3, y: 3};
        var style = {font: '28px Helvetica', fontWeight: 'bold', fill: "#FFF", align: "center"};
        copyright = game.add.text(game.world.centerX, game.world.centerY, 'Copyright Samuel Bouic 2015', style);
        copyright.anchor.setTo(0.5, -2.0);
        copyright.filters = [filterPixelate3];
        game.add.tween(copyright.scale).from({x: 3.0, y: 3.0}, 500, 'Bounce').start();
    },
    backToMenu: function() {
        musicCredits.stop();
        this.game.stateTransition.to('main-menu');
    },
    handleDisconnect: function() {
        console.log('Disconnect Credits!');
    },
    update: function() {
        filter.update();
    }
};