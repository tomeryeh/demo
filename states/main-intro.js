function MainIntroState() {}
MainIntroState.prototype = {
    create: function() {
        var title = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'title');
        title.anchor.setTo(0.5, 0.5);

        this.tweenFadeState();
    },
    tweenFadeState: function() {
        this.game.stateTransition.to('main-menu');
    }
};