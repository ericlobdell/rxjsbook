'use strict';

/// <reference path="../../Scripts/rx.all.js" />

var a = Rx.Observable.interval(2000).map(function (x) {
    return 'A' + x;
});

var b = Rx.Observable.interval(2000).map(function (x) {
    return 'B' + x;
});

//Rx.Observable.merge( a, b )
//    .subscribe( x => console.log( x ) );

var avg = Rx.Observable.interval(1000).scan(function (prev, curr) {
    return {
        sum: prev.sum + curr,
        count: prev.count + 1
    };
}, { sum: 0, count: 0 }).map(function (x) {
    return x.sum / x.count;
});

//var sub = avg.subscribe( x => console.log( `Average is ${x}` ) );

function concatAll(source) {
    return source.reduce(function (a, b) {
        return a.concat(b);
    });
}

var flattened = concatAll([[1, 2, 3], [45, 678, 9], ['a', 'b']]);
console.log(flattened);
"use strict";

/// <reference path="../../Scripts/rx.all.js" />

// Subject

//var subject = new Rx.Subject();
//var source = Rx.Observable.interval( 300 )
//    .map( v => `Interval message #${v}` )
//    .take( 5 );

//source.subscribe( subject );
//var sub = subject.subscribe(
//    ( x ) => console.log( `onNext ${x}` ),
//    ( e ) => console.log( `onError ${e.message}` ),
//    () => console.log( "onCompleted" )
//    );

//subject.onNext( "Our message 1" );
//subject.onNext( "Our message 2" );

//setTimeout(() => subject.onCompleted(), 1000 );

// AsyncSubject

//var delayedRange = Rx.Observable.range( 0, 5 ).delay( 1000 );
//var subject = new Rx.AsyncSubject();

//delayedRange.subscribe( subject );

//subject.subscribe(
//    ( x ) => console.log( `Value ${x}` ),
//    ( e ) => console.log( `Error ${e.message}` ),
//    () => console.log( "Completed" )
//    );

// BehaviorSubbject
var subject = new Rx.BehaviorSubject("Waiting for content");
subject.subscribe(function (x) {
    return console.log("Result " + x);
}, function (e) {
    return console.log("Error: " + e.message);
}, function () {
    return console.log("Completed");
});

var service = Rx.Observable.from([1, 2, 3, 4, 5], function (n) {
    return n * n;
});

service.subscribe(subject);
"use strict";

/// <reference path="../../Scripts/rx.dom.js" />
/// <reference path="../../Scripts/rx.all.js" />
/// <reference path="../../Scripts/leaflet/leaflet.js" />

var QUAKE_URL = "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp";

function loadJSONP(url) {
    var script = document.createElement("script");
    script.src = url;

    var head = document.getElementsByTagName("head")[0];
    head.appendChild(script);
}

var map = L.map('map').setView([33.858631, -118.279602], 7);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

var quakes = Rx.Observable.interval(5000).flatMap(function () {
    return Rx.DOM.jsonpRequest({
        url: QUAKE_URL,
        jsonpCallback: 'eqfeed_callback'
    }).retry(3);
}).flatMap(function (data) {
    return Rx.Observable.from(data.response.features);
}).distinct(function (q) {
    return q.properties.code;
});

quakes.subscribe(function (quake) {
    var coords = quake.geometry.coordinates;
    var size = quake.properties.mag * 10000;
    L.circle([coords[1], coords[0]], size).addTo(map);
});
//# sourceMappingURL=all.js.map
