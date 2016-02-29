user = {
  id: '0',
  meta: {
    type: 'none',           // cab or customer
    pos: {lon: 0, lat: 0},  // geoloc
    status: 'idle',         // the status
    sibling: 'none',        // the id of the other user this user is dealing with into an accepted proposal
    currentRide: null       // stores the current ride, if any
  },
  roomsToListen: {},
  proposals: {              // the current proposals
    mine: {},
    their: {}
  },

  setPos: function(pos, persistant, renew) {
    if (persistant === undefined) {
      persistant = true;
    }
    if (renew === undefined) {
      renew = true;
    }
    this.meta.pos = pos;
    this.save(persistant);
    if (user.roomsToListen.users !== undefined && renew) {
      this.subscribeToUsers(true); // renew the subscription
      _.forOwn(peopleMarkers, function(marker, id){
        deletePeople(id);
      });
      populateMap();
    }
  },

  setType: function(type) {
    this.meta.type = type;
    this.save();
  },

  setStatus: function(status) {
    this.meta.status = status;
    this.save();
  },

  create: function(cb) {
    // create the user into Kuzzle
    collections.users.createDocument(this.meta, {updateIfExist: true}, function (err, res) {
      if (err) {
        console.error(err);
      }
      user.id = res.id;
      $(window).on('beforeunload', function() {
        // delete the user and logout
        collections.users.deleteDocument(user.id, function(err, res){
          kuzzle.logout();
        });
      });
      cb();
    });
  },

  save: function(persistant) {
    // save the current user status into Kuzzle, only if it has been created
    var document;
    if (this.id !== '0') {
      if (persistant === undefined) {
        persistant = true;
      }
      if (persistant) {
        collections.users.createDocument(this.id, this.meta, {updateIfExist: true}, function (err, res) {
          if (err) {
            console.error(err);
          }
        });
      } else {
        document = _.cloneDeep(this.meta);
        document.id = this.id;
        collections.positions.publishMessage(document);
      }
    }
  },

  subscribeToUsers: function(renew) {
    var filter, options, statuses, types;

    // subscribe to users
    if (mode === 'cab') {
      statuses = ['idle', 'wantToHire', 'toHire', 'riding'];
      types = ['customer', 'cab'];
    } else {
      // people may want to see idle, toHire and hired cabs
      statuses = ['idle', 'toHire', 'hired', 'riding'];
      types = ['cab'];
    }

    filter = {
      and: [
        {
          terms:{
            type: types
          }
        },
        {
          terms: {
            status: statuses,
          }
        },
        {
          geo_distance: {
            distance: distanceFilter,
            pos: {lat: origLoc.lat, lon: origLoc.lon}
          }
        }
      ]
    };

    options = {
      subscribeToSelf: false
    };
    if (renew === true) {
      user.roomsToListen.users.renew(filter, function(err, res){
        if (err) {
          console.error(err);
        }
        if( res.scope !== 'out' ) {
          setPeopleMarker({id: res.result._id, meta: res.result._source});
        } else {
          deletePeople(res._id);
        }
      });
    } else {
      user.roomsToListen.users = collections.users.subscribe(filter, options, function(err, res) {
        if (err) {
          console.error(err);
        }
        if( res.scope !== 'out' ) {
          setPeopleMarker({id: res.result._id, meta: res.result._source});
        } else {
          deletePeople(res._id);
        }
      });
    }
  },

  subscribeToConnections: function() {
    user.roomsToListen.connections = collections.users.subscribe({}, {subscribeToSelf: false, scope: 'none', users: 'out', metadata: {_id: user.id}}, function(err, res) {
      if (err) {
        console.error(err);
      }
      // delete the point
      deletePeople(res.metadata._id);
      // the user is disconnected, but may be have not had the time to delete its document
      collections.users.deleteDocument(res.metadata._id);
    });
  },

  subscribeToRides: function(renew) {
    var filter, options, statuses, types;

    // subscribe to rides proposals
    filter = {
      or: [
        {
          term: {
            to: user.id
          }
        },
        {
          term: {
            from: user.id
          }
        }
      ]
    };

    user.roomsToListen.rides = collections.rides.subscribe(filter, {subscribeToSelf: false}, function (err, res) {
      if (err) {
        console.error(err);
      }
      if (res.action !== 'delete') {
        var proposal = res.result._source;
        var proposalId = res.result._id;
        if (proposal.from === user.id || proposal.status !== 'awaiting') {
          user.manageProposals.recieve.response(proposalId, proposal);
        } else {
          user.manageProposals.recieve.proposal(proposalId, proposal);
        }
      }
    });
  },

  subscribe: function() {
    // (un)subscribe automatically to some Kuzzle rooms
    // if the user is a cab, for example,
    //      - if will automatically stop to listen to any rooms
    //      - it will automatically listen to customer who wants to hire a cab within a radius of X meters

    this.unsubscribe();
    this.subscribeToUsers();
    this.subscribeToRides();
    this.subscribeToConnections();
  },

  unsubscribe: function() {
    _.forOwn(user.roomsToListen, function(room, name) {
      room.unsubscribe();
      delete user.roomsToListen[name];
    });
  },

  manageProposals: {

    propose: function(to, cb) {
      // make proposals to other users
      var proposal = {
        from: user.id,
        to: to,
        status: 'awaiting'
      };
      collections.rides.createDocument(proposal, function(err, res) {

        user.proposals.mine[res.id] = proposal;
        if(cb) {
          cb(res.id);
        }
      });
    },

    respond: function(proposalId, action, cb) {
      var proposal;
      if (user.proposals.their[proposalId] !== undefined) {
        proposal = user.proposals.their[proposalId];
      } else if (user.proposals.mine[proposalId]) {
        proposal = user.proposals.mine[proposalId];
      }

      switch (action) {
        case 'accept':
          proposal.status = 'accepted';
          break;
        case 'decline':
          proposal.status = 'declined';
          break;
        case 'cancel':
          proposal.status = 'cancelled';
          break;
      }

      collections.rides.updateDocument(proposalId, proposal, function(err, res) {

        // delete the proposal from storage
        delete user.proposals.their[proposalId];

        // TODO: change the ui for the dele

        switch (proposal.status) {
          case 'accepted':
            // mark the other people as the current sibling
            user.sibling = proposal.from;
            // store the ride
            user.currentRide = {id: proposalId, proposal: proposal};

            // change the user status and store it into kuzzle
            user.meta.status = 'riding';
            user.save(true);

            // cancel all other proposal this user has made
            _.forOwn(user.proposals.mine, function(_proposal, _id) {
              user.manageProposals.respond(_id, 'cancel');
            });

            // decline all other proposal this user has recieved
            _.forOwn(user.proposals.their, function(_proposal, _id) {
              user.manageProposals.respond(_id, 'decline');
            });

            $('#riding').show('200');
            $('#map').hide('200');

            if (cb) {
              cb();
            }
            break;
          case 'declined':
          case 'cancelled':
            if (cb) {
              cb();
            }
            break;
        }
      });
    },

    terminate: function(cb) {
      var people = peopleBucket[user.sibling];

      user.currentRide.proposal.status = 'finished';

      collections.rides.updateDocument(user.currentRide.id, user.currentRide.proposal, function(err, res) {
        if (err) {
          console.error(err);
        }

        setPeopleMarker(people);

        peopleMarkers[people.id].closePopup();

        user.sibling = null;
        user.currentRide = null;

        // change the user status and store it into kuzzle
        user.meta.status = 'idle';
        user.save(true);

        if (cb) {
          cb();
        }
      });
    },

    recieve: {
      proposal: function(proposalId, proposal, cb) {
        // it is a new proposal
        // store it
        user.proposals.their[proposalId] = proposal;

        // create a popup related to the sibling marker then open it
        var sibling = peopleBucket[proposal.from];
        var marker = peopleMarkers[sibling.id];
        var template = $('#' + sibling.meta.type + '_proposal_PopupTemplate').html();
        var data = {id: sibling.id, proposal: proposalId};

        marker.setPopupContent(Mustache.render(template, data));
        marker.openPopup();
        marker.setIcon(icons[sibling.meta.type].awaiting);

        if (cb) {
          cb();
        }
      },
      response: function(proposalId, proposal, cb) {

        switch (proposal.status) {
          case 'accepted':
            // delete the proposal from storage since it is not pending any more
            delete user.proposals.mine[proposalId];

            // mark the other people as the current sibling
            user.sibling = proposal.to;

            // store the ride
            user.currentRide = {id: proposalId, proposal: proposal};

            // change the user status and store it into kuzzle
            user.meta.status = 'riding';
            user.save(true);

            // cancel all other proposal this user has made
            _.forOwn(user.proposals.mine, function(_proposal, _id) {

              var sibling = peopleBucket[proposal.to];
              var marker = peopleMarkers[sibling.id];
              var template = $('#' + sibling.meta.type + '_' + sibling.meta.status + '_PopupTemplate').html();
              var data = {id: sibling.id};

              user.manageProposals.respond(_id, 'cancel', function(){
                marker.setPopupContent(Mustache.render(template, data));
                marker.closePopup();
              });
            });

            // decline all other proposal this user has recieved
            _.forOwn(user.proposals.their, function(_proposal, _id) {

              var sibling = peopleBucket[proposal.from];
              var marker = peopleMarkers[sibling.id];
              var template = $('#' + sibling.meta.type + '_' + sibling.meta.status + '_PopupTemplate').html();
              var data = {id: sibling.id};

              user.manageProposals.respond(_id, 'decline', function(){
                marker.setPopupContent(Mustache.render(template, data));
                marker.closePopup();
              });
            });

            $('#riding').show('200');
            $('#map').hide('200');

            if (cb) {
              cb();
            }
            break;
          case 'declined':
            // delete the proposal from storage since it is not pending any more
            delete user.proposals.mine[proposalId];
            var sibling = peopleBucket[proposal.to];
            var marker = peopleMarkers[sibling.id];
            var template = $('#' + sibling.meta.type + '_' + sibling.meta.status + '_PopupTemplate').html();
            var data = {id: sibling.id};

            collections.rides.deleteDocument(proposalId, function (err, res) {

              marker.setPopupContent(Mustache.render(template, data));
              marker.closePopup();

              notify('Proposal declined', '#' + sibling.id + ' had declined your proposal', 'info');

              if (cb) {
                cb();
              }
            });
            break;
          case 'cancelled':
            // delete the proposal from storage since it is not pending any more
            delete user.proposals.their[proposalId];

            var sibling = peopleBucket[proposal.from];
            var marker = peopleMarkers[sibling.id];
            var template = $('#' + sibling.meta.type + '_' + sibling.meta.status + '_PopupTemplate').html();
            var data = {id: sibling.id};

            collections.rides.deleteDocument(proposalId, function (err, res) {

              setPeopleMarker(sibling);
              marker.setPopupContent(Mustache.render(template, data));
              marker.closePopup();

              notify('Proposal cancelled', '#' + sibling.id + ' had cancelled his/her proposal', 'info');

              if (cb) {
                cb();
              }
            });
            break;
          case 'finished':
            var sibling = peopleBucket[user.sibling];
            var marker = peopleMarkers[user.sibling];
            var template = $('#' + sibling.meta.type + '_' + sibling.meta.status + '_PopupTemplate').html();
            var data = {id: user.sibling};

            collections.rides.deleteDocument(proposalId, function (err, res) {
              user.sibling = null;
              user.currentRide = null;

              // change the user status and store it into kuzzle
              user.meta.status = 'idle';
              user.save(true);

              marker.setPopupContent(Mustache.render(template, data));
              marker.closePopup();

              $('#riding').hide('200');
              $('#map').show('200');

              user.setStatus('idle');
              setIndicator();

              notify('Ride finished!', 'The ride with ' + sibling.meta.type + ' #' + sibling.id + ' is finished!', 'success');

              if (cb) {
                cb();
              }
            });
            break;
        }

      }

    }

  }

};
