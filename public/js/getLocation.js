"use strict";

/*
   _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _
  |                   |               |
  |                   |               |
  |     Santa Ana     |    Tustin     |
  |        (1)        |     (2)       |
  |                   |               |
  | _ _ _ _ _ _ _ _ _ | _ _ _ _ _ _ _ |
  |       |                           |
  |       |                           |
  | Costa |          Irvine           |
  | Mesa  |           (4)             |
  | (3)   |                           |
  | _ _ _ | _ _ _ _ _ _ _ _ _ _ _ _ _ |

  North bound: 33.766973
  South bound: 33.612013
  East bound: -117.756755
  West bound: -117.938547
  Santa Ana | Tustin: -117.839670
  Costa Mesa | Irvine: -117.896661
  Tusin | Irvine: 33.688811
*/

// global variables
const northBound = 33.766973;
const southBound = 33.612013;
const eastBound = -117.756755;
const westBound = -117.938547;
const SantaTustinBound = -117.839670;
const CostaIrvineBound = -117.896661;
const TustinIrvineBound = 33.688811;
const UCILocation = {lat: 33.64091921, lng: -117.84210205};

var updateIntervalId;
var updateCount;

var simulateIntervalId;
var simulateCount;

var map;
var markers = [];


// takes position and determins which district the user is belonged to
function getDistrict(latitude, longitude) {
  var district = -1;
  if (latitude > TustinIrvineBound) {
    if (longitude < SantaTustinBound) {
      district = 1;
    } else {
      district = 2;
    }
  } else {
    if (longitude < CostaIrvineBound) {
      district = 3;
    } else {
      district = 4;
    }
  }
  return district;
};

// parameters for spinner
var opts = {
  lines: 13 // The number of lines to draw
  , length: 28 // The length of each line
  , width: 14 // The line thickness
  , radius: 42 // The radius of the inner circle
  , scale: 1 // Scales overall size of the spinner
  , corners: 1 // Corner roundness (0..1)
  , color: '#000' // #rgb or #rrggbb or array of colors
  , opacity: 0.25 // Opacity of the lines
  , rotate: 0 // The rotation offset
  , direction: 1 // 1: clockwise, -1: counterclockwise
  , speed: 1 // Rounds per second
  , trail: 60 // Afterglow percentage
  , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
  , zIndex: 2e9 // The z-index (defaults to 2000000000)
  , className: 'spinner' // The CSS class to assign to the spinner
  , top: '50%' // Top position relative to parent
  , left: '50%' // Left position relative to parent
  , shadow: false // Whether to render a shadow
  , hwaccel: false // Whether to use hardware acceleration
  , position: 'absolute' // Element positioning
};
var spinner = new Spinner(opts).spin();

// retrieve rider's current location and post to the server
function requestRide() {
  if (navigator.geolocation) {
    console.log('location found');
    navigator.geolocation.getCurrentPosition(function(position) {
      map.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
      //createArrowMarker({lat: position.coords.latitude, lng: position.coords.longitude}, null).setMap(map);
      createMarker({lat: position.coords.latitude, lng: position.coords.longitude}, null, "default").setMap(map);
      postRiderPosition(position);
    });
    spinner.spin();
    $('#loading').append(spinner.el);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
};

// post rider's location to server
function postRiderPosition(position) {
  var district = getDistrict(position.coords.latitude, position.coords.longitude);
  console.log("Latitude: " + position.coords.latitude);
  console.log("Longitude: " + position.coords.longitude);
  console.log("District: " + district);
  $.post("/ride",{
    "latitude": position.coords.latitude,
    "longitude": position.coords.longitude,
    "district": district
  },function(message, status) {
    spinner.stop();
    alert(message + "Status: " + status);
  });
};

//retrieve driver's current location and post to the server periodically
function updateLocation() {
  if (navigator.geolocation) {
    console.log('location found');
    // update location every 5 seconds
    var interval = 5000;
    updateIntervalId = setInterval(setTime, interval);
    updateCount = 0;
    var updateInfo = document.getElementById("updateInfo");
    function setTime() {
      ++updateCount;
      console.log(updateCount + "th update");
      navigator.geolocation.getCurrentPosition(function(position) {
        postDriverPosition(position.coords.latitude, position.coords.longitude);
        trackDrivePath({lat: position.coords.latitude, lng: position.coords.longitude}, null);
      });
      updateInfo.innerHTML = updateCount;
      };
    } else {
    console.log("Geolocation is not supported by this browser.");
  }
};

function stopUpdate() {
  updateCount = 0;
  clearInterval(updateIntervalId);
}

// post driver's location to server
function postDriverPosition(latitude, longitude) {
  var district = getDistrict(latitude, longitude);
  console.log("   Latitude: " + latitude);
  console.log("   Longitude: " + longitude);
  console.log("   District: " + district);
  $.post("/drive",{
    "latitude": latitude,
    "longitude": longitude,
    "district": district
  });
};

//simulate driver driving and post location updates to the server periodically
function simulateDriving() {
  // start driving from UC Irvine
  var latitude = UCILocation.lat;
  var longitude = UCILocation.lng;
  // update location every 5 seconds
  var interval = 5000;
  simulateIntervalId = setInterval(setTime, interval);
  simulateCount = 0;
  var updateInfo = document.getElementById("updateInfo");
  function setTime() {
    ++simulateCount;
    var moveLat = Math.random() * 0.01;
    var moveLon = Math.random() * 0.01;
    if (moveLat < 0.005) {
      latitude += moveLat;
    } else {
      latitude -= moveLat;
    }
    if (moveLon < 0.005) {
      longitude += moveLon;
    } else {
      longitude -= moveLon;
    }
    // check if the driver goes beyond the bound
    if (longitude > eastBound) {
      longitude = eastBound;
    }
    else if (longitude < westBound) {
      longitude = westBound;
    }
    if (latitude > northBound) {
      latitude = northBound;
    }
    else if  (latitude < southBound) {
      latitude = southBound;
    }
    console.log(simulateCount + "th update");
    postDriverPosition(latitude, longitude);
    trackDrivePath({lat: latitude, lng: longitude}, null);
    updateInfo.innerHTML = simulateCount;
  };
}

function stopSimulate() {
  simulateCount = 0;
  clearInterval(simulateIntervalId);
}

// control parts for the buttons
$(document).ready(function(){
  $("#updateLocation").click(function(){
    document.getElementById("updateInfo").innerHTML = 0;
    spinner.spin();
    $('#loading').append(spinner.el);
    clearAllMarkers();;
    updateLocation();
  });
  $("#stopUpdate").click(function(){
    spinner.stop();
    stopUpdate();
  });
  $("#simulateDrive").click(function(){
    document.getElementById("updateInfo").innerHTML = 0;
    spinner.spin();
    $('#loading').append(spinner.el);
    clearAllMarkers();
    simulateDriving();
  });
  $("#stopSimulate").click(function(){
    spinner.stop();
    stopSimulate();
  });
});

// insert google map to display rider and driver location
function initMap() {
  map = new google.maps.Map(document.getElementById('googleMap'), {
    zoom: 11,
    center: UCILocation,
    mapTypeId:google.maps.MapTypeId.ROADMAP
  });
}
google.maps.event.addDomListener(window, 'load', initialize);


function createMarker(position, label, type) {
  const markerType = {
    "default": null,
    "circle": google.maps.SymbolPath.CIRCLE,
    "arrow": google.maps.SymbolPath.BACKWARD_CLOSED_ARROW
  };
  var marker = new google.maps.Marker({
    position: position,
    icon: {
      path: markerType[type],
      scale: 5
    },
    title: label
  });
  return marker;
}

// tracking driver's path using markers, arrow marker represents current location
function trackDrivePath(position, label) {
  // recenter the map at beginning
  if (markers.length == 0) {
    map.panTo(position)
  }
  const maxTrackPoints = 15;
  //var marker = createArrowMarker(position, label);
  var marker = createMarker(position, label, "arrow");
  if (markers.length >= maxTrackPoints) {
    // remove oldest marker
    var oldestMarker = markers.shift();
    oldestMarker.setMap(null);
  }
  if (markers.length > 0) {
    // change sencond newest marker to circle marker
    var sncdNewestMarker = markers.pop();
    sncdNewestMarker.setMap(null);
    //sncdNewestMarker = createCircleMarker(sncdNewestMarker.getPosition(), label);
    sncdNewestMarker = createMarker(sncdNewestMarker.getPosition(), label, "circle");
    sncdNewestMarker.setMap(map);
    markers.push(sncdNewestMarker);
  }
  // add newest marker
  marker.setMap(map);
  markers.push(marker);
}

// clear all the markers on map and empty the markers array
function clearAllMarkers() {
  while (markers.length != 0) {
    markers.pop().setMap(null);
  }
}
