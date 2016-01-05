'use strict';

var WebSocketServer = require('ws').Server;
var Twit = require('twit');
var Rx = require('rx');

var T = new Twit({
    consumer_key: 'uEFCwWouHHW6mGqbYqYSDeM9T',
    consumer_secret: 'i4WVh9FHcIxOba7VawKSKVlAH4q5TPYhaWo39JUpc4qt36UvO0',
    access_token: '163534651-PzqLUb66IbEXvnT8dcaIYL6BLI3dt31vtKxzofu7',
    access_token_secret: 'TLrLD4dtxyNVuP2djT0GpOGGH4BBUd49PCfBMq87NxuxD'
});

console.log("T: ", T);

var Server = new WebSocketServer({ port: 8080 });
Rx.Observable.fromEvent(Server, "connection").subscribe(onConnect);

console.log("Server: ", Server);

function onConnect(ws) {
    console.log("Client connected on localhost:8080");
}
//# sourceMappingURL=TwitterServer.js.map
