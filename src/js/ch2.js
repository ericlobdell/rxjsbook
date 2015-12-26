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
var subject = new Rx.BehaviorSubject( "Waiting for content" );
subject.subscribe(
    ( x ) => console.log( `Result ${x}` ),
    ( e ) => console.log( `Error: ${e.message}` ),
    () => console.log( "Completed" )
    );

var service = Rx.Observable.from( [1, 2, 3, 4, 5], ( n ) => n * n  );

service.subscribe( subject );
