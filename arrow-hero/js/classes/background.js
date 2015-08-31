KuzzleGame.Background = {};

KuzzleGame.Background = {
  sprite: null,
  filter: null,

  create: function(game, screen) {
    var fragmentSrcGame = [

      "precision mediump float;",

      "uniform vec2      resolution;",
      "uniform float     time;",

      "#define PI 90",

      "void main( void ) {",

      "vec2 p = ( gl_FragCoord.xy / resolution.xy ) - 0.175;",

      "float sx = 0.3 * (p.x + 0.8) * sin( 900.0 * p.x - 1. * pow(time, 0.55)*5.);",

      "float dy = 4./ ( 500.0 * abs(p.y - sx));",

      "dy += 1./ (25. * length(p - vec2(p.x, 0.)));",

      "gl_FragColor = vec4( (p.x + 0.1) * dy, 0.3 * dy, dy, 1.1 );",

      "}"
    ];

    var fragmentSrcTitle = [

      "precision mediump float;",

      "uniform vec2      resolution;",
      "uniform float     time;",

      "#define PI 90",

      "void main( void ) {",

      "vec2 p = ( gl_FragCoord.xy / resolution.xy ) - 0.5;",

      "float sx = 0.3 * (p.x + 0.8) * sin( 900.0 * p.x - 1. * pow(time, 0.55)*5.);",

      "float dy = 4./ ( 500.0 * abs(p.y - sx));",

      "dy += 1./ (25. * length(p - vec2(p.x, 0.)));",

      "gl_FragColor = vec4( (p.x + 0.1) * dy, 0.3 * dy, dy, 1.1 );",

      "}"
    ];


    this.filter = new Phaser.Filter(game, null, screen == 'game' ? fragmentSrcGame : fragmentSrcTitle);
    this.filter.setResolution(game.width, game.height);

    this.sprite = game.add.sprite();
    this.sprite.width = game.width;
    this.sprite.height = game.height;

    this.sprite.filters = [this.filter];
  },

  update: function() {
    this.filter.update();
  }
};
