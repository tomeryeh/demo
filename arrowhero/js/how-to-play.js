var HowToPlay = function(game) {};

HowToPlay.prototype = {
  preload: function() {

  },

  create: function() {
    var title = this.game.add.text(this.game.world.centerX, 100, "How to play", {
      font: "30px Arial",
      fill: "#ff0044",
      align: "center"
    });
    title.anchor.set(0.5, 0.5);

    this.game.add.text(50, 200, "1. Select your difficulty\n2. Wait for other player (press enter to play solo)\n3. Hit the right arrow when it overlap the empty arrow\n4. Press spacebar to send spells to your opponent\n5. Have fun ;)\n\n\n Special thanks to Aurelie Armand and Anthony Sandra for\n their contributions", {
      font: "25px Arial",
      fill: "#ff0044"
    });

    var returnText = this.game.add.text(this.game.world.centerX, this.game.height - 50, "-- click here to return --", {
      font: "30px Arial",
      fill: "#ff0044",
      align: "center"
    });
    returnText.anchor.setTo(0.5, 0.5);
    returnText.inputEnabled = true;
    returnText.events.onInputDown.add(function() {
      this.game.state.start("gametitle");
    }, this);
  }
};
