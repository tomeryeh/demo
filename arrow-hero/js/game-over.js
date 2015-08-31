var GameOver = function(game) {};

GameOver.prototype = {
  preload: function() {

  },

  create: function() {
    var scoreText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "Your score: " + KuzzleGame.Player.score + "\nYour opponent score: " + KuzzleGame.Player.opponentScore + "\n-- click to retry --", {
      font: "bold 40px Arial",
      fill: "#ff0044",
      align: 'center'
    });
    scoreText.anchor.setTo(0.5, 0.5);

    this.game.input.onDown.addOnce(this.retry, this);
  },

  retry: function() {
    this.game.state.start("gametitle");
  }
};
