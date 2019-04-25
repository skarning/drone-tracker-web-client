window.onload = init;

var mymap;
const HttpFlight = new XMLHttpRequest();
var sources = [];
var pathsAreActive = false;

updatefrequency = 1000;
userLocation = [0.0, 0.0];


//Sets timer for datastream and calls the map
function init() {
    var timer = setInterval("startDataStream()", updatefrequency);
    initMap();
}


function initMap() {
    startMap();
    getLocation();
}


//Gets IP-based location from user
function getLocation() {
    if (navigator.geolocation)
	navigator.geolocation.getCurrentPosition(formatLocation);
}


//Format IP-Based location and moves map to that location
function formatLocation(position) {
    userLocation[0] = position.coords.latitude;
    userLocation[1] = position.coords.longitude;
    mymap.flyTo([userLocation[0], userLocation[1]], 16);
}


function startMap() {
    mymap = L.map('mapid').setView([userLocation[0], userLocation[1]], 3);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoic2thcm5pbmciLCJhIjoiY2p1YjM5dnQxMDhsMzQ0cGk1NDNzeDN6YSJ9.Zmo1sjz7dnIR-1QVDo1SYA'
    }).addTo(mymap);
}


//Initalizes connection to API
function startDataStream() {
    var urlFlight = "http://dronetracker.tk:5000/api/flights";
    HttpFlight.open("GET", urlFlight);
    HttpFlight.send();
}


//Gets all flights
HttpFlight.onreadystatechange=(e)=> {
    if(HttpFlight.readyState == 4 && HttpFlight.status == 200) {
	var json = HttpFlight.responseText;
	var flights = JSON.parse(json);
	for (var i = 0; i < flights.length; i++) {
	    var flightnumber = flights[i].flight_number_id;
	    var operatorId = flights[i].operator_id;
	    var isActive = flights[i].is_active;
	    var rpasId = flights[i].rpas_id;
	    //Gets newest coordinates for each flight
	    getLatestPosition(flightnumber)
	}
    }
}


function getLatestPosition(flightnumber) {
    var urlPos = "http://dronetracker.tk:5000/api/flight/" + flightnumber + "/position_data";
    var HttpPosDat = new XMLHttpRequest();
    HttpPosDat.open("GET", urlPos);
    HttpPosDat.send();

    HttpPosDat.onreadystatechange = function() {
	if(HttpPosDat.readyState == 4 && HttpPosDat.status == 200) {
	    var json = HttpPosDat.responseText;
	    var posDat = JSON.parse(json);
	    if (posDat.length === 0) return;
	    i = posDat.length - 1;
	    var id = posDat[i].pos_data_id;
	    var flightId = posDat[i].flight_number_id;
 	    var time = posDat[i].time;
	    var latitude = posDat[i].latitude;
	    var longitude = posDat[i].longitude;
	    var altitude = posDat[i].altitude;
	    addCoord(flightId, latitude, longitude, altitude, time);
      addPolyLinePath(posDat);
  	}
  }
}


function addCoord(flightId, longitude, latitude, altitude, time){
    var sourceExists = false;
    var droneIcon = getIcon();
    var marker = L.marker([longitude, latitude], {icon: droneIcon});
    marker.bindPopup("Flightnumber: " + flightId + "<br>Altitude: " + altitude.toString() + "<br>Time: " + time.toString());
    marker.on('mouseover', function(){
	marker.openPopup();
    });
    marker.addTo(mymap)
    addNoFlightZone();
    for(var i = 0; i < sources.length; i++){
	if(flightId === sources[i].flightId) {
	    mymap.removeLayer(sources[i].marker)
	    sources[i].marker = marker;
	    sourceExists = true;
	    break;
	}
    }
    if(sourceExists === false)
	sources.push(new Source(flightId, altitude, marker));
}


class Source {
    constructor(flightId, altitude, marker) {
	this.flightId = flightId;
	this.altitude = altitude;
	this.marker = marker;
    }
}


function getIcon() {
    var icon = L.icon({
    iconUrl: 'icons/drone1.svg',

    iconSize:     [20, 45], // size of the icon
    iconAnchor:   [10, 22], // point of the icon which will correspond to marker's location
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    return icon;
}


//If the "Enable flight path" checkbox is unchecked, remove all polylines.
function flighPathCbClick(cb) {
  pathsAreActive = cb.checked;
  if(cb.checked == false){
    clearPolyLines();
  }
}


function clearPolyLines() {
    for(i in mymap._layers) {
        if(mymap._layers[i]._path != undefined) {
            try {
                mymap.removeLayer(mymap._layers[i]);
            }
            catch(e) {
                console.log("problem with " + e + mymap._layers[i]);
            }
        }
    }
}


function addPolyLinePath(flight) {
  var latlngs=[];
  if(pathsAreActive == true){
    var position;
    for(i = 0; i < flight.length ;i++){
      position = [flight[i].latitude, flight[i].longitude];
      latlngs.push(position);
    }
  }
    var polyline = L.polyline(latlngs, {color: 'red'}).addTo(mymap);
}


function addNoFlightZone() {
    var polygon = L.polygon([
	[59.131090, 11.355795],
	[59.130055, 11.355827],
	[59.130099, 11.354003],
	[59.131233, 11.354314]
    ]);

    polygon.setStyle({color: 'red',
		      fillColor: '#f03',
		      fillOpacity: 0.1}).addTo(mymap);
}
