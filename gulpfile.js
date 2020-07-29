var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var gulpMinify = require('gulp-minify');
var cleanCss = require('gulp-clean-css');


gulp.task('pack-js',function(){
    return gulp.src([
        'public/src/js/*.js',
    ])
    .pipe(gulpConcat('bundle.js'))
    .pipe(gulpMinify({
        ext:{
            min:'.js'
        },
        noSource: true
    }))
    .pipe(gulp.dest('public/src/js'))
})


gulp.task('pack-css',function(){
    return gulp.src([
        'public/src/css/*.css'
    ])
    .pipe(gulpConcat('stylesheet.css'))
    .pipe(cleanCss())
    .pipe(gulp.dest('public/src/css'))
})

gulp.task('default',gulp.parallel('pack-js','pack-css'))