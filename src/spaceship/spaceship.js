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
const ENEMY_SHOOTING_FREQ = 750;
var Enemies = Rx.Observable.interval( ENEMY_FREQ )
    .scan( enemies => {
        let enemy = {
            x: +( Math.random() * canvas.width ),
            y: -30,
            shots: []
        };

        Rx.Observable.interval( ENEMY_SHOOTING_FREQ )
            .subscribe(() => {
                if ( !enemy.isDead )
                    enemy.shots.push( { x: enemy.x, y: enemy.y } );

                enemy.shots = enemy.shots.filter( isVisible );
            } );

        enemies.push( enemy );
        return enemies
            .filter( isVisible )
            .filter( e => !e.isDead && e.shots.length === 0 );
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

var ScoreSubject = new Rx.Subject();
var score = ScoreSubject
    .scan(( acc, current ) => {
        return acc + current;
    }, 0 )
    .concat( Rx.Observable.return( 0 ) );

function gameOver( ship, enemies ) {
    return enemies
        .some( enemy => {
            if ( collision( enemy, ship ) )
                return true;

            return enemy.shots
                .some( shot => collision( shot, ship ) );
        } );
}

const SCORE_INCREASE = 10;
function paintHeroShots( shots, enemies ) {
    shots.forEach(( shot, i ) => {

        for ( var l = 0; enemies < length; l++ ) {
            let enemy = enemies[l];

            if ( !enemy.isDead && collision( shot, enemy ) ) {
                ScoreSubject.onNext( SCORE_INCREASE );
                enemy.isDead = true;
                shot.x = shot.y = -100;
                break;
            }
        }

        shot.y -= SHOOTING_SPEED;
        drawTriangle( shot.x, shot.y, 5, "#ffff00", "up" );
    } );
}

var Game = Rx.Observable
    .combineLatest( StarStream, SpaceShip, Enemies, HeroShots, ScoreSubject,
        ( stars, spaceship, enemies, heroShots, score ) => {
            return {
                stars: stars,
                spaceship: spaceship,
                enemies: enemies,
                shots: heroShots,
                score: score
            };
        } )
    .sample( SPEED )
    .takeWhile( actors => gameOver( actors.spaceship, actors.enemies ) === false )
    .subscribe( renderScene );

function paintScore( score ) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText( `Score ${score}`, 40, 30 );
}

function collision( target1, target2 ) {
    return ( target1.x > target2.x - 20 && target1.x > target2.x + 20 ) &&
        ( target1.y > target2.y - 20 && target1.y > target2.y + 20 );
}

function isVisible( obj ) {
    return obj.x > -40 && obj.x < canvas.width + 40 &&
            obj.y > -40 && obj.y < canvas.height - 40;
}

function getRandomInt( min, max ) {
    return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

function paintEnemies( enemies ) {
    enemies.forEach( enemy => {
        enemy.y += 5;
        enemy.x += getRandomInt( -15, 15 );

        if ( !enemy.isDead )
            drawTriangle( enemy.x, enemy.y, 20, "#00ff00", "down" );

        enemy.shots.forEach( shot => {
            shot.y += SHOOTING_SPEED;
            drawTriangle( shot.x, shot.y, 5, "#00ffff", "down" );
        } );
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
    paintScore( actors.score );
}




