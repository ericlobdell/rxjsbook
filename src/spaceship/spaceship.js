/// <reference path="../../Scripts/rx.all.js" />

var canvas = document.createElement( "canvas" );
var ctx = canvas.getContext( "2d" );
document.body.appendChild( canvas );

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const SPEED = 40;
const STAR_COUNT = 250;

var StarStream = Rx.Observable.range( 1, STAR_COUNT )
    .map(() => {
        return {
            x: +( Math.random() * canvas.width ),
            y: +( Math.random() * canvas.height ),
            size: Math.random() * 3 + 1
        }
    } )
    .toArray()
    .flatMap( stars => {
        return Rx.Observable.interval( SPEED )
            .map(() => {
                stars.forEach( s => {
                    if ( s.y >= canvas.height )
                        s.y = 0;

                    s.y += 3;
                } );

                return stars;
            } );
    } );

const HERO_Y = canvas.height - 30;
var mouseMove = Rx.Observable.fromEvent( canvas, "mousemove" );
var SpaceShip = mouseMove
    .map( e => {
        return {
            x: e.clientX,
            y: HERO_Y
        };
    } )
    .startWith( {
        x: canvas.width / 2,
        y: HERO_Y
    } );

const ENEMY_FREQ = 1500;
var Enemies = Rx.Observable.interval( ENEMY_FREQ )
    .scan( enemies => {
        enemies.push( {
            x: +( Math.random() * canvas.width ),
            y: -30
        } );

        return enemies;
    }, [] );

var playerFiring = Rx.Observable
    .merge(
        Rx.Observable.fromEvent( canvas, "click" ),
        Rx.Observable.fromEvent( canvas, "keydown" )
            .filter( e => e.keycode === 32 )
    )
    .sample( 200 )
    .timestamp();

var HeroShots = Rx.Observable
    .combineLatest(
    playerFiring,
    SpaceShip,
    ( shots, spaceShip ) => {
        return {
            x: spaceShip.x,
            timestamp: shots.timestamp
        }
    }
    )
    .distinctUntilChanged( shot => shot.timestamp )
    .scan(( shots, shot ) => {
        shots.push( {
            x: shot.x,
            y: HERO_Y
        } );

        return shots;
    }, [] );

var SHOOTING_SPEED = 15;

function paintHeroShots( shots ) {
    shots.forEach( shot => {
        console.log( "Shot Fired!", shot );
        shot.y -= SHOOTING_SPEED;

        drawTriangle( shot.x, shot.y, 5, "#ffff00", "up" );
    } );
}

var Game = Rx.Observable
    .combineLatest( StarStream, SpaceShip, Enemies, HeroShots,
        ( stars, spaceship, enemies, heroShots ) => {
            return {
                stars: stars,
                spaceship: spaceship,
                enemies: enemies,
                shots: heroShots
            };
        } )
    .sample( SPEED )
    .subscribe( renderScene );

function isVisible( obj ) {
    return obj.x > -40 && obj.x < canvas.width + 40 &&
            obj.y > -40 && obj.y < canvas.height + 40;
}

function getRandomInt( min, max ) {
    return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

function paintEnemies( enemies ) {
    enemies.forEach( e => {
        e.y += 5;
        e.x += getRandomInt( -15, 15 );
        drawTriangle( e.x, e.y, 20, "#00ff00", "down" );
    } );
}

function drawTriangle( x, y, width, color, direction ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo( x - width, y );
    ctx.lineTo( x, direction === 'up' ? y - width : y + width );
    ctx.lineTo( x + width, y );
    ctx.lineTo( x - width, y );
    ctx.fill();
}

function paintSpaceship( x, y ) {
    drawTriangle( x, y, 20, "#ff0000", 'up' );
}

function paintStars( stars ) {
    ctx.fillStyle = "#000000";
    ctx.fillRect( 0, 0, canvas.width, canvas.height );

    ctx.fillStyle = "#ffffff";
    stars.forEach( s => ctx.fillRect( s.x, s.y, s.size, s.size ) );
}

function renderScene( actors ) {
    paintStars( actors.stars );
    paintSpaceship( actors.spaceship.x, actors.spaceship.y );
    paintEnemies( actors.enemies );
    paintHeroShots( actors.shots );
}




