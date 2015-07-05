game = new Game();
game.start();
game.gameData = {};
function getPlayerById(id) {
    var player = null;
    game.gameData.players.forEach(function(e, i) {
        if(e.id == id) player = e;
    });
    return player;
}