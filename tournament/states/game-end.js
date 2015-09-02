var
  iWon,
  currentTeam;

function GameEndState() {}
GameEndState.prototype = {
  init: function () {
    self = this;
  },

  create: function () {
    if(this.game.hasMusic) {
      musicEnd = this.game.add.audio('music-game');
      musicEnd.play();
    }

    game.stage.backgroundColor = 0x000000;
    iWon = false;

    switch(Room.rules.mode.id) {
      case 'FFA':
        if (Room.winner === game.player.id) {
          iWon = true;
        }
        break;
      case 'TM':
        currentTeam = 'red';
        Room.rules.teams.blue.forEach(function (id) {
          if (game.player.id === id) {
            currentTeam = 'blue';
          }
        });

        if(Room.winner === currentTeam) {
          iWon = true;
        }
        break;
    }

    self.showWinner();
},

showWinner: function () {
  var
    color = Phaser.Color.getWebRGB(0xFFFFFF),
    style = {font: "24px Helvetica", fill: color, align: "center"};

  winner = game.add.text(50, 100, 'Test', style);
  winner.alpha = 0.0;

  switch (Room.rules.mode.id) {
    case 'FFA':
      winner.text = (iWon ? 'Congratulations!\nYou won!' : 'The winner is ' + Players[Room.winner].username);
      break;
    case 'TM':
      winner.text = (iWon ? 'Congratulations!\nYour team won!' : 'You failed!\n' + Room.winner + ' team wins!');
      break;
  }

  game.add.tween(winner.scale).to({x: 2.0, y: 2.0}, 1000, 'Bounce').delay(200).start();
  game.add.tween(winner).to({alpha: 1.0}, 500, 'Linear').delay(200).start();

  if (this.game.hasMusic) {
    musicEnd.stop();
  }
}
};
