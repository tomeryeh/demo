game = new Game();
game.start();
game.room = {};

function getPlayerById(id) {
    var player = null;
    game.room.players.forEach(function(e, i) {
        if(e.id == id) player = e;
    });
    return player;
}