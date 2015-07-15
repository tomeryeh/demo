function MainIntroState() {}
MainIntroState.prototype = {
    create: function() {
        this.tweenFadeState();
    },
    tweenFadeState: function() {
        this.game.stateTransition.to('main-menu');
    }
};