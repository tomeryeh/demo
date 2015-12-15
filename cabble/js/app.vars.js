var mode = 'none';

var collections;

var kuzzle;

var user;

var UIOk = false;
var map, origLoc = {lat: 0, lon: 0};
var userMarker, userMarkerDraggable = false;
var peopleLayer = new L.featureGroup();
var userLayer = new L.featureGroup();
var peopleMarkers = {};
var peopleBucket = {};

var reCenterTimer;

// Default values
var maxWidthPopup = 175;
var iconSize = [38, 38];
var popupAnchor = [0, -22];
var defaultZoom = config.map.defaultZoom;
var defaultLoc = config.map.defaultLoc;
var distanceFilter = config.cabble.distanceFilter;
var isKuzzleOffline = true, isKuzzleOnline = false;

// Icons
var icons = {
  cab: {
    idle: L.icon({
      iconUrl: 'images/cab.idle.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }),
    toHire: L.icon({
      iconUrl: 'images/cab.toHire.gif',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }),
    riding: L.icon({
      iconUrl: 'images/cab.riding.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }),
    mine: L.icon({
      iconUrl: 'images/cab.mine.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }),
    awaiting: L.icon({
      iconUrl: 'images/cab.awaiting.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    })
  }, 
  customer: {
    idle: L.icon({
      iconUrl: 'images/customer.idle.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }), 
    wantToHire: L.icon({
      iconUrl: 'images/customer.wantToHire.gif',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }),
    mine: L.icon({
      iconUrl: 'images/customer.mine.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }),
    awaiting: L.icon({
      iconUrl: 'images/customer.awaiting.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    }),
    riding: L.icon({
      iconUrl: 'images/customer.riding.png',
      iconSize: iconSize,
      popupAnchor: popupAnchor
    })
  }
};