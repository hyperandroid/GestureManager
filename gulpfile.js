var gulp = require('gulp');

var concat = require('gulp-concat');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');

gulp.task('scripts', function() {
    return gulp.src(
            [
                "src/Namespace.js",
                "src/GestureRecognizer.js",
                "src/GR_Tap.js",
                "src/GR_LongTap.js",
                "src/GR_DoubleTap.js",
                "src/GR_Pinch5.js",
                "src/GR_PinchZoom.js",
                "src/GR_Swipe.js",
                "src/GestureManager.js"
            ],
            {base :'src/' } )
        .pipe(concat('gesturemanager.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('gesturemanager.min.js'));
});

gulp.task('lint', function() {
    return gulp.src('src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('default', ['lint','scripts']);