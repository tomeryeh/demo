KuzzleGame.HitZone = {};

KuzzleGame.HitZone = {
  game: null,

  hitZoneX: 0,
  hitZoneY: 0,
  hitZoneWidth: 0,
  hitZoneHeight: 0,

  upLine: null,
  downLine: null,

  rectangle: null,

  init: function(game) {
    this.game = game;

    this.hitZoneY = this.game.height * 0.75;
    this.hitZoneWidth = this.game.width;
    this.hitZoneHeight = this.game.height * 0.15;

    this.createLines();
  },

  createLines: function() {
    this.upLine = this.game.add.graphics(0, 0);
    this.upLine.lineStyle(10, 3743923, 0.1);
    //var upLineTween = this.game.add.tween(this.upLine).to({alpha: 3}, 5000, Phaser.Easing.Linear.None, true, 0, -1);
    //upLineTween.yoyo(true, 500);

    this.downLine = this.game.add.graphics(0, 0);
    this.downLine.lineStyle(10, 3743923, 0.1);
    //var downLineTween = this.game.add.tween(this.downLine).to({alpha: 3}, 5000, Phaser.Easing.Linear.None, true, 0, -1);
    //downLineTween.yoyo(true, 500);

    this.upLine.drawRect(this.hitZoneX, this.hitZoneY, this.hitZoneWidth, 1);
    this.downLine.drawRect(this.hitZoneX, this.hitZoneY + this.hitZoneHeight, this.hitZoneWidth, 1);

    this.rectangle = this.game.add.sprite(this.hitZoneX, this.hitZoneY, null);
    this.rectangle.width = this.hitZoneWidth;
    this.rectangle.height = this.hitZoneHeight;
    this.game.physics.enable(this.rectangle, Phaser.Physics.ARCADE);
  }
};
