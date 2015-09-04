var preload = function(game) {};

preload.prototype = {
  preload: function() {
    var loadingBar = this.add.sprite(160, 240, "loading");
    loadingBar.anchor.setTo(0.5, 0.5);
    this.load.setPreloadSprite(loadingBar);

    //BUTTONS
    this.game.load.spritesheet('button', 'assets/buttons/spacebar.png', 224, 70);

    // IMAGES
    this.game.load.spritesheet('arrows', 'assets/sprites/arrows.png', 64, 63);
    this.game.load.spritesheet('explosion', 'assets/sprites/explosion.png', 64, 64, 24);
    this.game.load.spritesheet('pacman', 'assets/sprites/pacman_28x28.png', 28, 28, 4);
    this.game.load.spritesheet('kirby', 'assets/sprites/kirby.png', 40, 39);

    // SOUND EFFECTS
    this.game.load.audio('hit', ['assets/audio/soundeffects/hit.wav']);
    this.game.load.audio('miss', ['assets/audio/soundeffects/miss.wav']);
    this.game.load.audio('spell-bonus', ['assets/audio/soundeffects/spell-bonus.wav']);
    this.game.load.audio('pacman-move', ['assets/audio/soundeffects/pacman-move.wav']);
    this.game.load.audio('pacman-eat', ['assets/audio/soundeffects/pacman-eat.wav']);
    this.game.load.audio('send-spell', ['assets/audio/soundeffects/magic.mp3']);
    this.game.load.audio('receive-spell', ['assets/audio/soundeffects/spell.mp3']);
    this.game.load.audio('not-enough-score', ['assets/audio/soundeffects/not-enough-score.mp3']);

    //this.game.load.audio('deepbluesky', ['assets/audio/music/extreme/Graphiqs_Groove_-_09_-_Deep_Sky_Blue.ogg','assets/audio/music/extreme/Graphiqs_Groove_-_09_-_Deep_Sky_Blue.mp3']);
    //this.game.load.audio('utopia', ['assets/audio/music/extreme/YACHT_-_01_-_Utopia_instrumental.ogg','assets/audio/music/extreme/YACHT_-_01_-_Utopia_instrumental.mp3']);
    //this.game.load.audio('memories', ['assets/audio/music/hard/Risey_-_02_-_Memories_Of_Thailand_Beat_Doctors_stuck_in_Britain_remix.ogg','assets/audio/music/hard/Risey_-_02_-_Memories_Of_Thailand_Beat_Doctors_stuck_in_Britain_remix.mp3']);
    //this.game.load.audio('funkylicious', ['assets/audio/music/hard/Fhernando_-_01_-_Funkylicious_Album_Version.ogg','assets/audio/music/hard/Fhernando_-_01_-_Funkylicious_Album_Version.mp3']);
    //this.game.load.audio('needlove', ['assets/audio/music/hard/Fhernando_-_10_-_I_Need_Ya_LOVE.ogg','assets/audio/music/hard/Fhernando_-_10_-_I_Need_Ya_LOVE.mp3']);
    //this.game.load.audio('liftoff', ['assets/audio/music/normal/Jahzzar_-_01_-_Lift_Off.ogg','assets/audio/music/normal/Jahzzar_-_01_-_Lift_Off.mp3']);
    //this.game.load.audio('shangrila', ['assets/audio/music/normal/YACHT_-_10_-_Shangri-La_instrumental.ogg','assets/audio/music/normal/YACHT_-_10_-_Shangri-La_instrumental.mp3']);
  },

  create: function() {
    this.game.state.start("gametitle");
  }
};
