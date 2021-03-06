var prepareCollections = function(cb) {
  _.forOwn(config.collections.mapping, function(mapping, name) {
    // get the current mapping
    collections[name].getMapping(function (err, res) {
      if (res === undefined) {
        // assumes there is currently no mapping
        collections[name]
          .dataMappingFactory(mapping)
          .apply(function (err, res) {
            if(cb) {
              cb();
            }
          })
      } else {
        // there is a mapping, lets compare
        var keys = Object.keys(mapping);
        if (res.mapping[keys[0]] === undefined || res.mapping[keys[0]].type !== mapping[keys[0]].type) {
          // the mappings differs, lets put the right one
          collections[name]
            .dataMappingFactory(mapping)
            .apply(function (err, res) {
              if(cb) {
                cb();
              }
            })
        } else {
          if(cb) {
            cb();
          }
        }
      }
    });
  });
};

var populateMap = function() {
  // populate the map with actual data depending on the mode
  var statuses,
    types,
    query;

  if (mode === 'cab') {
    statuses = ['idle', 'wanttohire', 'tohire', 'riding'];
    types = ['customer', 'cab'];
  } else {
    // people may want to see idle, toHire and hired cabs
    statuses = ['idle', 'tohire', 'hired', 'riding'];
    types = ['cab'];
  }

  query = {
    query: {
      terms: {
        type: types
      }
    },
    filter: {
      and: [
        {
          geo_distance: {
            distance: distanceFilter,
            pos: {lat: origLoc.lat, lon: origLoc.lon}
          }
        },
        {
          terms: {
            status: statuses,
          }
        }
      ]
    }
  };

  collections.users.advancedSearch(query, function (err, res) {
    if (res !== undefined) {
      res.documents.forEach(function (element, index) {
        setPeopleMarker({id: element.id, meta: element.content});
      });
    }
  });
};

// Set the default location from real geoloc or from the default one if
// the geolocation API is not available or if the user refuses to use it
var setLoc = function() {
	var getLoc = function(loc) {
    origLoc = {lat: loc.coords.latitude, lon: loc.coords.longitude};
    user.setPos(origLoc, true, false);
    return origLoc;
  }
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getLoc);
  } else {
    origLoc = defaultLoc;
    user.setPos(origLoc, true, false);
  }
  if (origLoc.lat === 0 && origLoc.lon === 0) {
    origLoc = defaultLoc;
  }
  return origLoc;
};


// Set the user menu in the top right of the map
var setIndicator = function() {
  if (mode == 'cab') {
    $('#mode-indicator').html('<img src="images/cab.idle.png" width="18" height="18"> You are a cab');
    $('#user-action .label').html('Look for customers');
  } else {
    $('#mode-indicator').html('<img src="images/customer.idle.png" width="18" height="18"> You are a customer');
    $('#user-action .label').html('Look for a cab');
  }
  user.setType(mode);
};


// Set the user marker and configure the map to handle it correctly
var setUserMarker = function() {
  if (userMarker) {
    // remove the current user marker if any
    userLayer.removeLayer(userMarker);
  }

  userMarker = L.marker([origLoc.lat, origLoc.lon], {icon: icons[mode].mine, riseOnHover: true});

  // if the user drags the marker, center the map on it
  userMarker.bindPopup('This is you!');
  userMarker.on('drag', function() {
    var ll = userMarker.getLatLng();
    origLoc = {lat: ll.lat, lon: ll.lng};
//    user.setPos(origLoc, false, false);
    user.setPos(origLoc, true, false); // persistant not renew the room
  });
  userMarker.on('dragend', function() {
    var ll = userMarker.getLatLng();
    origLoc = {lat: ll.lat, lon: ll.lng};
    user.setPos(origLoc, true, true);
    map.setView(ll);
    userLayer.bringToFront();
    setUserSearchZone();
  });

  userLayer.addLayer(userMarker);
  userLayer.bringToFront();
  peopleLayer.bringToBack();
  setUserSearchZone();
  map
    .on('dragstart', function() {
            // if a timer is set for center the map onto the user, kill it
            clearTimeout(reCenterTimer);
          })
    .on('dragend', function() {
      // on drag end, recenter the map to the user position 3 seconds later if it is out of the view
      /*reCenterTimer = setTimeout(function() {
        map.fitBounds(userLayer.getBounds(), {maxZoom: defaultZoom});
      }, 3000);*/
    });
};

// Set the user marker and configure the map to handle it correctly
var setPeopleMarker = function(people) {
  if (people.id === user.id) {
    return;
  }
  var found = false;

  if (peopleBucket[people.id] !== undefined) {
    peopleBucket[people.id].meta.pos = people.meta.pos;
  } else {
    peopleBucket[people.id] = people;
  }

  if (peopleMarkers[people.id] === undefined) {
    var peopleMarker = L.marker([people.meta.pos.lat, people.meta.pos.lon], {icon: icons[people.meta.type][people.meta.status]});
    if ($('#' + people.meta.type + '_' + people.meta.status + '_PopupTemplate').length === 1) {
      _.forOwn(user.proposals.their, function(_proposal, _id) {
        if (_proposal.from === people.id) {
          peopleMarker.bindPopup(Mustache.render($('#' + people.meta.type + '_proposal_PopupTemplate').html(), {id: people.id, proposal: _id}));
          found = true;
        }
      });
      if (!found) {
        _.forOwn(user.proposals.mine, function(_proposal, _id) {
          if (_proposal.to === people.id) {
            peopleMarker.bindPopup(Mustache.render($('#' + people.meta.type + '_toProposal_PopupTemplate').html(), {id: people.id}));
            found = true;
          }
        });
      }
      if (!found) {
        peopleMarker.bindPopup(Mustache.render($('#' + people.meta.type + '_' + people.meta.status + '_PopupTemplate').html(), people));
      }
    }
    peopleLayer.addLayer(peopleMarker);
    peopleMarkers[people.id] = peopleMarker;
    if (found) {
      peopleMarker.openPopup();
    }
  } else if (people.meta !== undefined) {
    // the marker had been updated
    peopleMarkers[people.id].setLatLng(people.meta.pos);

    // Set the icon
    if (people.id === user.sibling) {
      peopleMarkers[people.id].setIcon(icons[people.meta.type].mine);
      peopleMarkers[people.id].setPopupContent(Mustache.render($('#' + people.meta.type + '_mine_PopupTemplate').html(), people));
    } else {
      peopleMarkers[people.id].setIcon(icons[people.meta.type][people.meta.status]);

      _.forOwn(user.proposals.their, function(_proposal, _id) {
        if (_proposal.from === people.id) {
          peopleMarkers[people.id].setPopupContent(Mustache.render($('#' + people.meta.type + '_proposal_PopupTemplate').html(), {id: people.id, proposal: _id}));
          found = true;
        }
      });
      if (!found) {
        _.forOwn(user.proposals.mine, function(_proposal, _id) {
          if (_proposal.to === people.id) {
            peopleMarkers[people.id].setPopupContent(Mustache.render($('#' + people.meta.type + '_toProposal_PopupTemplate').html(), {id: people.id}));
            found = true;
          }
        });
      }
      if (!found) {
        if (people.meta.type !== mode) {
          peopleMarkers[people.id].setPopupContent(Mustache.render($('#' + people.meta.type + '_' + people.meta.status + '_PopupTemplate').html(), people));
        }
      }
    }


  }
  userLayer.bringToFront();
  peopleLayer.bringToBack();
};

var deletePeople = function(id) {
    peopleMarkers[id].closePopup();
    peopleMarkers[id].unbindPopup();
    peopleLayer.removeLayer(peopleMarkers[id]);
    delete peopleMarkers[id];
};

var setUserSearchZone = function() {
  if (userSearchZone !== undefined) {
    map.removeLayer(userSearchZone);
  }
  if (distanceFilter === undefined) {
    distanceFilter = config.cabble.distanceFilter;
  }
  userSearchZone = L.circle(user.meta.pos, distanceFilter, {
    color: '#88BDEC',
    opacity: 0.3,
    weight: 2,
    fillColor: '#A8C1D6'
  }).addTo(map);
}

// start the map
var startMap = function() {
  // hide the welcome screen
  $('#home').hide();
  // show the map in fullscreen
  $('#mapview').height($(window).height()).removeClass('hidden');

  map = L.map('map').setView(origLoc, defaultZoom);

  L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
   attribution: 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
   maxZoom: 18
 }).addTo(map);
  user.create(function() {
    // one the map is set up, set the other parts of the UI
    setIndicator();
    setUserMarker();
    userLayer.addTo(map);
    peopleLayer.addTo(map);
    userLayer.bringToFront();
    peopleLayer.bringToBack();
    populateMap();
    // finally create the user into Kuzzle and subscribe to rooms
    user.subscribe();
    userLayer.bringToFront();
    peopleLayer.bringToBack();
  });
};

var initializeUi = function () {
  if (UIOk) {
    return;
  }
  UIOk = true;

  // Let the user choose to be a cab or a customer
  $('.trigger-start').click(function() {
    // save the mode
    mode = $(this).data('mode');
    // start the map !
    startMap();
  });

  // this let the user change the mode, cab from customer and vice versa
  $('#change-behavior').click(function() {
    location.reload();
  });

  // this allow the user to drag and drop his marker on the map
  $('#move-user').click(function() {
    userMarkerDraggable = !userMarkerDraggable;
    if (userMarkerDraggable) {
      $(this).removeClass('btn-info').addClass('btn-warning');
      userMarker.dragging.enable();
    } else {
      $(this).addClass('btn-info').removeClass('btn-warning');
      userMarker.dragging.disable();
    }
  });

  // this allow the user to tell kuzzle he is looking for something or to go back to idle
  $('#user-action').click(function(){
    if (user.meta.status == 'idle') {
      if (mode == 'cab') {
        user.setStatus('toHire');
        $('#user-action .label').html('Stop looking for customers');
      } else {
        user.setStatus('wantToHire');
        $('#user-action .label').html('Stop looking for a cab');
      }
    } else {
      user.setStatus('idle');
      setIndicator();
    }
  });

  // how to propose a ride
  $('#map').on('click','.propose', function() {
    var $btn = $(this).button('sending');

    user.manageProposals.propose($btn.data('sibling'), function(id) {
      $btn.button('awaiting');
      $btn.data('proposal', id);
    });

    $btn.prop('disabled', true);
    $(this).siblings('.cancel').show('200');
  });

  // how to cancel the proposal
  $('#map').on('click','.cancel', function() {
    var $this = $(this);
    var $btn = $this.siblings('.propose');

    user.manageProposals.respond($btn.data('proposal'), 'cancel', function() {
      var people = peopleBucket[$this.data('sibling')];
      setPeopleMarker(people);
      peopleMarkers[people.id].closePopup();

      $btn.button('reset');
      $btn.prop('disabled', false);
      $this.hide('50');
    });
  });

  // how to accept a proposal
  $('#map').on('click', '.accept', function() {
    var $this = $(this);
    var $btn = $this.button('sending');
    $this.prop('disabled', true);
    user.manageProposals.respond($btn.data('proposal'), 'accept');
  });

  // how to decline a proposal
  $('#map').on('click', '.decline', function() {
    var $this = $(this);
    var $btn = $this.button('sending');
    $this.prop('disabled', true);
    user.manageProposals.respond($btn.data('proposal'), 'decline', function() {
      $this.prop('disabled', false);
      var people = peopleBucket[$this.data('sibling')];
      setPeopleMarker(people);
      peopleMarkers[people.id].closePopup();
    });
  });

  $('#riding button').click(function() {
    var $this = $(this).button('sending');
    user.manageProposals.terminate(function() {
      $('#riding').hide('200');
      $('#map').show('200');
      $this.button('reset');

      user.setStatus('idle');
      setIndicator();
    });
  });

  // handles kuzzle disconnect
  isKuzzleOffline = kuzzle.addListener('disconnected', function (room, subscription) {
    if (!$('#loader').is(":visible")) {
      $('#loader').show(200);
    }
  });
  isKuzzleOnline = kuzzle.addListener('reconnected', function (room, subscription) {
    if ($('#loader').is(":visible")) {
      $('#loader').hide(200);
    }
  });
  // hide the loader
  $('#loader').hide(200);
};

var notify = function(title, message, type) {
  if (type === undefined) {
    type = 'info';
  }
  PNotify.prototype.options.delay = 3000;
  var stack_bottomright = {
    addpos2: 0,
    animation: true,
    dir1: 'up',
    dir2: 'left',
    firstpos1: 25,
    firstpos2: 25,
    nextpos1: 25,
    nextpos2: 25
  };

  var opts = {
    title: title,
    text: message,
    addclass: 'stack-bottomright',
    cornerclass: '',
//    width: '100%',
    stack: stack_bottomright,
    type: type,
    styling: 'bootstrap3'
  };
  new PNotify(opts);
};
