function PreloadState() {}
PreloadState.prototype = {
    preload: function() {
        // Global
        this.game.load.script('blurX', 'engine/filters/BlurX.js');
        this.game.load.script('blurY', 'engine/filters/BlurY.js');
        this.game.load.script('pixelate', 'engine/filters/PixelateFilter.js');
        this.load.script('vignette', 'engine/filters/Vignette.js');
        this.load.script('noise', 'engine/filters/SNoise.js');
        this.load.script('grain', 'engine/filters/FilmGrain.js');
        this.load.script('ascii', 'engine/filters/AsciiFilter.js');
        this.game.load.image('kuzzleTitle', 'assets/sprites/kuzzle.png');
        this.game.load.bitmapFont('font', 'assets/fonts/font.png', 'assets/fonts/font.fnt');

        // Music
        //this.game.load.audio('music-main-menu', 'assets/musics/boot-sequence.wav');
        this.game.load.audio('music-options', 'assets/musics/hot-pursuit.wav');
        this.game.load.audio('music-connecting', 'assets/musics/cyber-soldier.wav');
        this.game.load.audio('music-lobby', 'assets/musics/lobby.mp3');
        this.game.load.audio('music-game', 'assets/musics/twin-turbo.mp3');
        this.game.load.audio('music-main-menu', 'assets/musics/epic-song.mp3');
        this.game.load.audio('club-fight', 'assets/musics/club-fight.mp3');
        this.game.load.audio('nvision', 'assets/musics/nvision.mp3');
        this.game.load.audio('angry-mod', 'assets/musics/angry-mod.mp3');

            // Intro
        this.game.load.image('title', 'assets/sprites/title.png');

        // Main Menu
        this.game.load.image('main-menu-online-game-selected', 'assets/sprites/main-menu/online-game-yellow.png');
        this.game.load.image('main-menu-online-game-unselected', 'assets/sprites/main-menu/online-game-orange.png');
        this.game.load.image('main-menu-options-selected', 'assets/sprites/main-menu/options-yellow.png');
        this.game.load.image('main-menu-options-unselected', 'assets/sprites/main-menu/options-orange.png');
        this.game.load.image('main-menu-credits-selected', 'assets/sprites/main-menu/credits-yellow.png');
        this.game.load.image('main-menu-credits-unselected', 'assets/sprites/main-menu/credits-orange.png');
        this.game.load.image('version', 'assets/sprites/version.png');

        // Options
        this.game.load.image('options-menu-fullscreen-selected', 'assets/sprites/options/fullscreen-yellow.png');
        this.game.load.image('options-menu-fullscreen-unselected', 'assets/sprites/options/fullscreen-orange.png');
        this.game.load.image('options-menu-music-selected', 'assets/sprites/options/music-yellow.png');
        this.game.load.image('options-menu-music-unselected', 'assets/sprites/options/music-orange.png');
        this.game.load.image('options-menu-sounds-selected', 'assets/sprites/options/sounds-yellow.png');
        this.game.load.image('options-menu-sounds-unselected', 'assets/sprites/options/sounds-orange.png');
        this.game.load.image('options-menu-back-selected', 'assets/sprites/options/back-yellow.png');
        this.game.load.image('options-menu-back-unselected', 'assets/sprites/options/back-orange.png');
        this.game.load.image('go-selected', 'assets/sprites/options/go-yellow.png');
        this.game.load.image('go-unselected', 'assets/sprites/options/go-orange.png');

        // Credits
        this.game.load.image('phaser2', 'assets/sprites/credits/phaser2.png');
    },
    create: function() {
        gameMusics = {
            'CITY': this.game.add.audio('club-fight'),
            'KUZZLE': this.game.add.audio('nvision'),
            'GLITCH': this.game.add.audio('angry-mod')
        };
        this.game.stateTransition = this.game.plugins.add(Phaser.Plugin.StateTransition);
        this.game.juicy = this.game.plugins.add(Phaser.Plugin.Juicy);
        this.game.stateTransition.configure({
            duration: Phaser.Timer.SECOND * 0.8,
            ease: Phaser.Easing.Exponential.Out,
            properties: {
                alpha: 0.0,
                scale: {
                    x: 1.4,
                    y: 1.4
                }
            }
        });
        this.game.state.start('main-intro');
        //this.game.state.start('game-round-no-monster');
        //this.game.state.start('game-round');
        //this.game.state.start('game-init');
    }
};