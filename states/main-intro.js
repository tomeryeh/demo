function MainIntroState() {}
MainIntroState.prototype = {
    create: function() {
        var title = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'title');
        title.anchor.setTo(0.5, 0.5);

        // add main intro assets into the world
        /*timer = new Phaser.Timer(this.game);
        timer.add(3000, this.tweenFadeState(), this);
        timer.start();*/
        var timer = this.game.time.create(true);
        timer.add(3000, this.tweenFadeState());
        timer.start();
    },
    tweenFadeState: function() {
        this.game.stateTransition.to('main-menu');
    }
};