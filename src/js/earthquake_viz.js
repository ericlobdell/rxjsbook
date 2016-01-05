/// <reference path="../../Scripts/rx.dom.js" />
/// <reference path="../../Scripts/rx.all.js" />
/// <reference path="../../Scripts/leaflet/leaflet.js" />

var QUAKE_URL = "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp";

var map = L.map( 'map' ).setView( [33.858631, -118.279602], 7 );
L.tileLayer( 'http://{s}.tile.osm.org/{z}/{x}/{y}.png' ).addTo( map );

let codeLayers = {};
let quakeLayer = L.layerGroup( [] ).addTo( map );
let identity = Rx.helpers.identity;
let table = document.getElementById( "quakes-info" );

Rx.DOM.ready().subscribe( init );

function init() {
    var socket = Rx.DOM.fromWebSocket( "ws://127.0.0.1:8080" );
    var quakes = Rx.Observable
    .interval( 5000 )
    .flatMap(() => {
        return Rx.DOM.jsonpRequest( {
            url: QUAKE_URL,
            jsonpCallback: 'eqfeed_callback'
        } ).retry( 3 );
    } )
    .flatMap( data => Rx.Observable.from( data.response.features ) )
    .distinct( q => q.properties.code )
    .share();

    quakes.subscribe( quake => {
        let coords = quake.geometry.coordinates;
        let size = quake.properties.mag * 10000;
        let circle = L.circle( [coords[1], coords[0]], size ).addTo( map );

        quakeLayer.addLayer( circle );
        codeLayers[quake.id] = quakeLayer.getLayerId( circle );
    } );

    quakes
        .pluck( "properties" )
        .map( makeRow )
        .bufferWithTime( 500 )
        .filter( rows => rows.length )
        .map( rows => {
            let fragment = document.createDocumentFragment();

            rows.forEach( row =>
                fragment.appendChild( row ) );

            return fragment;
        } )
        .subscribe( fragment => table.appendChild( fragment ) );

    quakes
        .bufferWithCount( 100 )
        .subscribe( quakes => {
            let qdata = quakes.map( q => {
                return {
                    id: q.properties.net + q.properties.code,
                    lat: q.geometry.coordinates[1],
                    lng: q.geometry.coordinates[0],
                    mag: q.properties.mag
                }
            } );

            socket.onNext( JSON.stringify( { quakes: qdata } ) );
        } );

    socket.subscribe( message => {
        console.log( "Server message: ", JSON.parse( message.data ) );
    } )

    getRowFromEvent( 'mouseover' )
        .pairwise()
        .subscribe( rows => {
            let prevCircle = quakeLayer.getLayer( codeLayers[rows[0].id] );
            let currCircle = quakeLayer.getLayer( codeLayers[rows[1].id] );

            prevCircle.setStyle( { color: "#ff0000" } );
            currCircle.setStyle( { color: "#0000ff" } );
        } );

    getRowFromEvent( 'click' )
        .subscribe( row => {
            let circle = quakeLayer.getLayer( codeLayers[row.id] );
            map.panTo( circle.getLatLng() );
        } );

}

function getRowFromEvent( event ) {
    return Rx.Observable
        .fromEvent( table, event )
        .filter( e => e.target.tagName === 'TD' && e.target.parentNode.id.length )
        .pluck( 'target', 'parentNode' )
        .distinctUntilChanged()
}

function isHovering( element ) {
    let over = Rx.DOM.mouseover( element ).map( identity( true ) );
    let out = Rx.DOM.mouseout( element ).map( identity( true ) );

    return over.merge( out );
}

function makeRow( props ) {
    let row = document.createElement( "tr" );
    row.id = props.net + props.code;

    let date = new Date( props.time );
    let time = date.toString();

    [props.place, props.mag, time].forEach( data => {
        let cell = document.createElement( "td" );
        cell.textContent = data;
        row.appendChild( cell );
    } );

    return row;
}
