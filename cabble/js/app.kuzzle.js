$(function() {
  // instantiate the kuzzle object and perform some more thing when done
  kuzzle = new Kuzzle(config.kuzzleUrl, {autoReconnect: true}, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      // then instantiate the collections
      collections = {
        users: kuzzle.dataCollectionFactory(config.collections.names.users),
        connections: kuzzle.dataCollectionFactory(config.collections.names.users),
        rides: kuzzle.dataCollectionFactory(config.collections.names.rides)
      };
      // first, prepare the collections
      prepareCollections(function (){
        
        // then get the current location
        setLoc();
        
        // then impulse the interface
        initializeUi();
      });
    }
  });
});