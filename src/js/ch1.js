/// <reference path="../../Scripts/rx.all.js" />

var a = Rx.Observable.interval( 2000 )
    .map( x => 'A' + x );

var b = Rx.Observable.interval( 2000 )
    .map( x => 'B' + x );

//Rx.Observable.merge( a, b )
//    .subscribe( x => console.log( x ) );

var avg = Rx.Observable.interval( 1000 )
    .scan(( prev, curr ) => {
        return {
            sum: prev.sum + curr,
            count: prev.count + 1
        }
    }, { sum: 0, count: 0 } )
    .map( x => x.sum / x.count );

//var sub = avg.subscribe( x => console.log( `Average is ${x}` ) );

function concatAll( source ) {
    return source.reduce(( a, b ) => a.concat( b ) );
}

var flattened = concatAll( [[1, 2, 3], [45, 678, 9], ['a', 'b']] );
console.log( flattened );




