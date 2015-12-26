"use strict";

/// <reference path="../../Scripts/rx.all.js" />

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var SPEED = 40;
var STAR_COUNT = 250;

var StarStream = Rx.Observable.range(1, STAR_COUNT).map(function () {
    return {
        x: +(Math.random() * canvas.width),
        y: +(Math.random() * canvas.height),
        size: Math.random() * 3 + 1
    };
}).toArray().flatMap(function (stars) {
    return Rx.Observable.interval(SPEED).map(function () {
        stars.forEach(function (s) {
            if (s.y >= canvas.height) s.y = 0;

            s.y += 3;
        });

        return stars;
    });
});

var HERO_Y = canvas.height - 30;
var mouseMove = Rx.Observable.fromEvent(canvas, "mousemove");
var SpaceShip = mouseMove.map(function (e) {
    return {
        x: e.clientX,
        y: HERO_Y
    };
}).startWith({
    x: canvas.width / 2,
    y: HERO_Y
});

var ENEMY_FREQ = 1500;
var Enemies = Rx.Observable.interval(ENEMY_FREQ).scan(function (enemies) {
    enemies.push({
        x: +(Math.random() * canvas.width),
        y: -30
    });

    return enemies;
}, []);

var playerFiring = Rx.Observable.merge(Rx.Observable.fromEvent(canvas, "click"), Rx.Observable.fromEvent(canvas, "keydown").filter(function (e) {
    return e.keycode === 32;
})).sample(200).timestamp();

var HeroShots = Rx.Observable.combineLatest(playerFiring, SpaceShip, function (shots, spaceShip) {
    return {
        x: spaceShip.x,
        timestamp: shots.timestamp
    };
}).distinctUntilChanged(function (shot) {
    return shot.timestamp;
}).scan(function (shots, shot) {
    shots.push({
        x: shot.x,
        y: HERO_Y
    });

    return shots;
}, []);

var SHOOTING_SPEED = 15;

function paintHeroShots(shots) {
    shots.forEach(function (shot) {
        console.log("Shot Fired!", shot);
        shot.y -= SHOOTING_SPEED;

        drawTriangle(shot.x, shot.y, 5, "#ffff00", "up");
    });
}

var Game = Rx.Observable.combineLatest(StarStream, SpaceShip, Enemies, HeroShots, function (stars, spaceship, enemies, heroShots) {
    return {
        stars: stars,
        spaceship: spaceship,
        enemies: enemies,
        shots: heroShots
    };
}).sample(SPEED).subscribe(renderScene);

function isVisible(obj) {
    return obj.x > -40 && obj.x < canvas.width + 40 && obj.y > -40 && obj.y < canvas.height + 40;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function paintEnemies(enemies) {
    enemies.forEach(function (e) {
        e.y += 5;
        e.x += getRandomInt(-15, 15);
        drawTriangle(e.x, e.y, 20, "#00ff00", "down");
    });
}

function drawTriangle(x, y, width, color, direction) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - width, y);
    ctx.lineTo(x, direction === 'up' ? y - width : y + width);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x - width, y);
    ctx.fill();
}

function paintSpaceship(x, y) {
    drawTriangle(x, y, 20, "#ff0000", 'up');
}

function paintStars(stars) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    stars.forEach(function (s) {
        return ctx.fillRect(s.x, s.y, s.size, s.size);
    });
}

function renderScene(actors) {
    paintStars(actors.stars);
    paintSpaceship(actors.spaceship.x, actors.spaceship.y);
    paintEnemies(actors.enemies);
    paintHeroShots(actors.shots);
}
//# sourceMappingURL=spaceship.js.map
