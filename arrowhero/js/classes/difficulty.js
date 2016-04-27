KuzzleGame.Difficulty = typeof KuzzleGame.Difficulty === 'undefined' ? {} : KuzzleGame.Difficulty;

KuzzleGame.Difficulty = {
  DIFFICULTY_NORMAL: 2000,
  DIFFICULTY_HARD: 1500,
  DIFFICULTY_EXTREME: 1000,
  DIFFICULTY_120: 120,
  currentDifficulty: 0,


  setDifficulty: function(difficulty) {

    if (difficulty == this.DIFFICULTY_HARD) {
      KuzzleGame.Level.arrowsProbability = [0, 0.3, 0.2, 0.2, 0.3];
    }

    if (difficulty == this.DIFFICULTY_EXTREME) {
      KuzzleGame.Level.arrowsProbability = [0.2, 0.2, 0.2, 0.2, 0.2];
    }

    this.currentDifficulty = difficulty;
  }

};
