window.onload = init;

var mymap;
const HttpFlight = new XMLHttpRequest();
var sources = [];

updatefrequency = 1000;
userLocation = [0.0, 0.0];


//Sets timer for datastram and calls the map
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
    console.log(sources);
    var urlFlight = "http://dronetracker.tk:5000/api/flights";
    HttpFlight.open("GET", urlFlight);
    HttpFlight.send();
}


HttpFlight.onreadystatechange=(e)=> {
    if(HttpFlight.readyState == 4 && HttpFlight.status == 200) {
	var json = HttpFlight.responseText;
	var flights = JSON.parse(json);
	for (var i = 0; i < flights.length; i++) {
	    var flightnumber = flights[i].flight_number_id;
	    var operatorId = flights[i].operator_id;
	    var isActive = flights[i].is_active;
	    var rpasId = flights[i].rpas_id;
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
	    addCoord(flightId, latitude, longitude, altitude);
	}
    }
}


function addCoord(flightId, longitude, latitude, altitude){
    var sourceExists = false;
    var marker = L.marker([latitude, longitude]);
    marker.addTo(mymap)
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
