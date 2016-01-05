'use strict';

/// <reference path="../../Scripts/rx.dom.js" />
/// <reference path="../../Scripts/rx.all.js" />
/// <reference path="../../Scripts/leaflet/leaflet.js" />

var QUAKE_URL = "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp";

var map = L.map('map').setView([33.858631, -118.279602], 7);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

var codeLayers = {};
var quakeLayer = L.layerGroup([]).addTo(map);
var identity = Rx.helpers.identity;
var table = document.getElementById("quakes-info");

Rx.DOM.ready().subscribe(init);

function init() {
    var socket = Rx.DOM.fromWebSocket("ws://127.0.0.1:8080");
    var quakes = Rx.Observable.interval(5000).flatMap(function () {
        return Rx.DOM.jsonpRequest({
            url: QUAKE_URL,
            jsonpCallback: 'eqfeed_callback'
        }).retry(3);
    }).flatMap(function (data) {
        return Rx.Observable.from(data.response.features);
    }).distinct(function (q) {
        return q.properties.code;
    }).share();

    quakes.subscribe(function (quake) {
        var coords = quake.geometry.coordinates;
        var size = quake.properties.mag * 10000;
        var circle = L.circle([coords[1], coords[0]], size).addTo(map);

        quakeLayer.addLayer(circle);
        codeLayers[quake.id] = quakeLayer.getLayerId(circle);
    });

    quakes.pluck("properties").map(makeRow).bufferWithTime(500).filter(function (rows) {
        return rows.length;
    }).map(function (rows) {
        var fragment = document.createDocumentFragment();

        rows.forEach(function (row) {
            return fragment.appendChild(row);
        });

        return fragment;
    }).subscribe(function (fragment) {
        return table.appendChild(fragment);
    });

    quakes.bufferWithCount(100).subscribe(function (quakes) {
        var qdata = quakes.map(function (q) {
            return {
                id: q.properties.net + q.properties.code,
                lat: q.geometry.coordinates[1],
                lng: q.geometry.coordinates[0],
                mag: q.properties.mag
            };
        });

        socket.onNext(JSON.stringify({ quakes: qdata }));
    });

    socket.subscribe(function (message) {
        console.log("Server message: ", JSON.parse(message.data));
    });

    getRowFromEvent('mouseover').pairwise().subscribe(function (rows) {
        var prevCircle = quakeLayer.getLayer(codeLayers[rows[0].id]);
        var currCircle = quakeLayer.getLayer(codeLayers[rows[1].id]);

        prevCircle.setStyle({ color: "#ff0000" });
        currCircle.setStyle({ color: "#0000ff" });
    });

    getRowFromEvent('click').subscribe(function (row) {
        var circle = quakeLayer.getLayer(codeLayers[row.id]);
        map.panTo(circle.getLatLng());
    });
}

function getRowFromEvent(event) {
    return Rx.Observable.fromEvent(table, event).filter(function (e) {
        return e.target.tagName === 'TD' && e.target.parentNode.id.length;
    }).pluck('target', 'parentNode').distinctUntilChanged();
}

function isHovering(element) {
    var over = Rx.DOM.mouseover(element).map(identity(true));
    var out = Rx.DOM.mouseout(element).map(identity(true));

    return over.merge(out);
}

function makeRow(props) {
    var row = document.createElement("tr");
    row.id = props.net + props.code;

    var date = new Date(props.time);
    var time = date.toString();

    [props.place, props.mag, time].forEach(function (data) {
        var cell = document.createElement("td");
        cell.textContent = data;
        row.appendChild(cell);
    });

    return row;
}
//# sourceMappingURL=earthquake_viz.js.map
