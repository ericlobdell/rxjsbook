/// <reference path="../node_modules/ws/index.js" />
/// <reference path="../Scripts/rx.all.js" />

var WebSocketServer = require( 'ws' ).Server;
var Twit = require( 'twit' );
var Rx = require( 'rx' );

var T = new Twit( {
    consumer_key: 'uEFCwWouHHW6mGqbYqYSDeM9T',
    consumer_secret: 'i4WVh9FHcIxOba7VawKSKVlAH4q5TPYhaWo39JUpc4qt36UvO0',
    access_token: '163534651-PzqLUb66IbEXvnT8dcaIYL6BLI3dt31vtKxzofu7',
    access_token_secret: 'TLrLD4dtxyNVuP2djT0GpOGGH4BBUd49PCfBMq87NxuxD'
} );

var Server = new WebSocketServer( { port: 8080 } );
Rx.Observable.fromEvent( Server, "connection" ).subscribe( onConnect );

function onConnect( ws ) {
    console.log( "Client connected on localhost:8080" );

    var stream = T.stream( "statuses/filter", {
        track: 'earthquake',
        locations: []
    } );

    Rx.Observable.fromEvent( stream, "tweet" )
      .subscribe( function ( tweet ) {
          console.log( "TWEET: ", tweet );
          ws.send( JSON.stringify( tweet ), function ( error ) {
              if ( error )
                  console.log( "There was an error sending message." )
          } );
      } );

    var onMessage = Rx.Observable.fromEvent( ws, 'message' )
        .subscribe( quakeData => {
            var quake = JSON.parse( quakeData );
            console.log( "Quake on server: ", quake );
        } );
}
