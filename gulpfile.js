﻿
var gulp = require( 'gulp' );
var minifyCss = require( "gulp-minify-css" );
var less = require( "gulp-less" );
var sourcemaps = require( 'gulp-sourcemaps' );
var babel = require( 'gulp-babel' );
var rename = require( "gulp-rename" );
var concat = require( 'gulp-concat' );
var uglify = require( 'gulp-uglify' );
var watch = require( 'gulp-watch' );
var webserver = require('gulp-webserver');

gulp.task( 'build', function () {
    return gulp.src( ['src/**/*.js' ] )
        .pipe( sourcemaps.init() )
        .pipe( babel( {
            presets: ['es2015']
        } ) )
		.pipe( sourcemaps.write( '.' ) )
		.pipe( gulp.dest( 'dist' ) );
} );

gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver({
      fallback: 'index.html',
      open: true
    }));
});

gulp.task( "less", function () {
    gulp.src( ["src/less/*.less"] )
        .pipe( less() )
        .pipe( minifyCss( { keepBreaks: false } ) )
        .pipe( rename( {
            suffix: ".min"
        } ) )
        .pipe( gulp.dest( "dist/css" ) );
} );

gulp.task( "watch", function () {
    gulp.watch( 'src/**/*.js', ["build", "webserver"] );
} );

gulp.task( "default", function () {
    gulp.start( ["build", "webserver", "watch"] );
} );
