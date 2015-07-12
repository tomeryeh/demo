function Game() {}
Game.prototype = {
    start: function() {
        game = new Phaser.Game(640, 360, Phaser.AUTO, 'kuzzle-fighters');

        game.state.add('boot', BootState);

        game.state.add('preload', PreloadState);

        game.state.add('game-round', GameRoundState);

        game.state.add('game-round-no-monster', GameRoundNoMonsterState);

        game.state.add('main-intro', MainIntroState);

        game.state.add('main-menu', MainMenuState);

        game.state.add('options', OptionsState);

        game.state.add('credits', CreditsState);

        game.state.add('connecting', ConnectingState);

        game.state.add('lobby', LobbyState);

        //game.state.add('level', LevelState);

        game.state.start('boot');
    }
};