$(function() {
  // instantiate the kuzzle object and perform some more thing when done
  kuzzle = new Kuzzle(config.kuzzleUrl, config.index,  {autoReconnect: true}, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      // then instantiate the collections
      collections = {
        users: kuzzle.dataCollectionFactory(config.collections.names.users),
        connections: kuzzle.dataCollectionFactory(config.collections.names.users),
        rides: kuzzle.dataCollectionFactory(config.collections.names.rides)
      };
      _.forOwn (collections, function(collection) {
        collection.create();
      });
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