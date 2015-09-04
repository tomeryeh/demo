function Game() {}
Game.prototype = {
    start: function() {
        game = new Phaser.Game(640, 360, Phaser.WEBGL, 'kuzzle-tournament');

        game.state.add('boot', BootState);

        game.state.add('preload', PreloadState);

        game.state.add('game-init', GameInitState);

//        game.state.add('game-round', GameRoundState);

        game.state.add('game-round-no-monster', GameRoundNoMonsterState);

        game.state.add('main-intro', MainIntroState);

        game.state.add('main-menu', MainMenuState);

        game.state.add('options', OptionsState);

        game.state.add('credits', CreditsState);

        game.state.add('connecting', ConnectingState);

        game.state.add('lobby', LobbyState);

        game.state.add('game-end', GameEndState);

        game.state.add('not-enough-players', NotEnoughPlayersState);

        game.state.start('boot');
    }
};
