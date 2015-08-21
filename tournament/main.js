game = new Game();

game.start();

console.dir(game);

room = {
    players: [],
    joiningPlayers : []
};

function getPlayerById(id) {
    var player = false;
    room.players.forEach(function(e, i) {
        if(e.id == id) player = e;
    });
    return player;
}
