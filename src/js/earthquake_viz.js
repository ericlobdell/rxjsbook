/// <reference path="../../Scripts/rx.dom.js" />
/// <reference path="../../Scripts/rx.all.js" />
/// <reference path="../../Scripts/leaflet/leaflet.js" />

var QUAKE_URL = "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp";

function loadJSONP( url ) {
    let script = document.createElement( "script" );
    script.src = url;

    let head = document.getElementsByTagName( "head" )[0];
    head.appendChild( script );


}

var map = L.map( 'map' ).setView( [33.858631, -118.279602], 7 );
L.tileLayer( 'http://{s}.tile.osm.org/{z}/{x}/{y}.png' ).addTo( map );

var quakes = Rx.Observable
    .interval( 5000 )
    .flatMap(() => {
        return Rx.DOM.jsonpRequest( {
            url: QUAKE_URL,
            jsonpCallback: 'eqfeed_callback'
        } ).retry( 3 );
    } )
    .flatMap( data => Rx.Observable.from( data.response.features ) )
    .distinct( q => q.properties.code );

quakes.subscribe( quake => {
    let coords = quake.geometry.coordinates;
    let size = quake.properties.mag * 10000;
    L.circle( [coords[1], coords[0]], size ).addTo( map );
} );