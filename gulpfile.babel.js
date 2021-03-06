'use strict';

import babel from 'gulp-babel';
import sass from 'gulp-sass';
import gulp from 'gulp';
import uglify from 'gulp-uglify';
import browsersync from 'browser-sync';
import sourcemaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin';
import concat from 'gulp-concat';
import minify from 'gulp-clean-css';
import autoprefixer from 'gulp-autoprefixer';
import ftp from 'vinyl-ftp';
import gutil from 'gulp-util';

const config = require("./package.json").config,
    ftpCreds = require("./ftp.json").credentials,
    ftpGlobs = require("./ftp.json").globs,
    log = require('fancy-log'),
    dir = require("./ftp.json").uploaddir;

/**
 * Global Tasks
 */
let conn = ftp.create({
    host: ftpCreds.host,
    user: ftpCreds.user,
    password: ftpCreds.password,
    parallel: 10,
    log: log
});

gulp.task('deploy', ['images', 'frontend:js', 'frontend:sass'], () => {

    return gulp.src(ftpGlobs, { base: '.', buffer: false })
        .pipe(conn.newer(dir)) // only upload newer files
        .pipe(conn.dest(dir));
});

gulp.task('images', () => {
    gulp.src(config.assets.images)
        .pipe(imagemin({
            progressive: true,
            optimizationLevel: 3,
            interlaced: true,
            svgoPlugins: [{ removeViewBox: false }]
        }))
        .pipe(gulp.dest(config.public.destIMG))
});

/** FTP Tasks
 * 
 */

gulp.task('frontend:ftp:css', ['frontend:sass'], () => {
    return gulp.src(config.public.destCSS)
        .pipe(conn.newer(dir))
        .pipe(conn.dest(dir));
});

gulp.task('frontend:ftp:js', ['frontend:js'], () => {
    return gulp.src(config.public.destJS)
        .pipe(conn.newer(dir))
        .pipe(conn.dest(dir));
});

gulp.task('frontend:ftp:images', ['images'], () => {
    return gulp.src(config.public.destIMG)
        .pipe(conn.newer(dir))
        .pipe(conn.dest(dir));
});





/**
 * Front End Tasks
 */

gulp.task('frontend:js', () => {
    return gulp.src(config.assets.frontend.scripts)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(concat(config.public.frontend.scripts))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(config.public.destJS))
        .pipe(rename(config.public.frontend.scriptsMin))
        .pipe(uglify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destJS))
});

gulp.task('frontend:vendor:js', () => {
    return gulp
        .src(config.assets.frontend.vendor.scripts,
            { base: 'node_modules/' })
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(concat(config.public.frontend.vendor.scripts))
        .pipe(gulp.dest(config.public.destJS))
        .pipe(rename(config.public.frontend.vendor.scriptsMin))
        .pipe(uglify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destJS))
});

gulp.task('frontend:sass', () => {
    return gulp.src(config.assets.frontend.stylesMain)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename(config.public.frontend.styles))
        .pipe(gulp.dest(config.public.destCSS))
        .pipe(rename(config.public.frontend.stylesMin))
        .pipe(minify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destCSS))
});

gulp.task('frontend:vendor:sass', () => {
    return gulp.src(config.assets.frontend.vendor.stylesMain)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(sass({
            includePaths: config.assets.frontend.vendor.styles //Specify vendor styles here
        }).on('error', sass.logError))
        .pipe(rename(config.public.frontend.vendor.styles))
        .pipe(gulp.dest(config.public.destCSS))
        .pipe(rename(config.public.frontend.vendor.stylesMin))
        .pipe(minify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destCSS))
});

/**
 * Front End Sync
 */

gulp.task('frontend:sync:init', function () {
    browsersync.init({
        proxy: config.browsersync.projectURL,
        open: false,
        notify: false
    });
});

gulp.task('frontend:sync:sass', () => {
    return gulp.src(config.assets.frontend.stylesMain)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename(config.public.frontend.styles))
        .pipe(gulp.dest(config.public.destCSS))
        .pipe(browsersync.stream())
        .pipe(rename(config.public.frontend.stylesMin))
        .pipe(minify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destCSS))
        .pipe(browsersync.stream())
});

gulp.task('frontend:sync:js', () => {
    return gulp.src(config.assets.frontend.scripts)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(concat(config.public.frontend.scripts))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(config.public.destJS))
        .pipe(browsersync.stream())
        .pipe(rename(config.public.frontend.scriptsMin))
        .pipe(uglify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destJS))
        .pipe(browsersync.stream())
});




/**
 * Admin Tasks
 */

gulp.task('admin:js', () => {
    return gulp.src(config.assets.admin.scripts)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(concat(config.public.admin.scripts))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(config.public.destJS))
        .pipe(rename(config.public.admin.scriptsMin))
        .pipe(uglify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destJS))
});

gulp.task('admin:vendor:js', function () {
    return gulp.src(config.assets.admin.vendor.scripts)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(concat(config.public.admin.vendor.scripts))
        .pipe(gulp.dest(config.public.destJS))
        .pipe(rename(config.public.admin.vendor.scriptsMin))
        .pipe(uglify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destJS))
});

gulp.task('admin:sass', () => {
    return gulp.src(config.assets.admin.stylesMain)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(rename(config.public.admin.styles))
        .pipe(gulp.dest(config.public.destCSS))
        .pipe(rename(config.public.admin.stylesMin))
        .pipe(minify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destCSS))
});

gulp.task('admin:vendor:sass', () => {
    return gulp.src(config.assets.admin.vendor.stylesMain)
        .pipe(sourcemaps.init({ 'loadMaps': true }))
        .pipe(sass({
            includePaths: config.assets.admin.vendor.styles //Specify vendor styles here
        }).on('error', sass.logError))
        .pipe(rename(config.public.admin.vendor.styles))
        .pipe(gulp.dest(config.public.destCSS))
        .pipe(rename(config.public.admin.vendor.stylesMin))
        .pipe(minify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(config.public.destCSS))
});

/**
 * Multifaceted tasks
 */

gulp.task('build', ['frontend:sass', 'frontend:js']);
gulp.task('build:admin', ['admin:sass', 'admin:js']);

gulp.task('prep', ['frontend:vendor:sass', 'frontend:vendor:js']);
gulp.task('prep:sync', ['prep']);
gulp.task('prep:admin', ['admin:vendor:sass', 'admin:vendor:js']);
gulp.task('prep:all', ['frontend:vendor:sass', 'frontend:vendor:js', 'images', 'admin:vendor:sass', 'admin:vendor:js']);

gulp.task('sync', ['frontend:sync:init', 'frontend:sync:sass', 'frontend:sync:js']);

gulp.task('default', ['prep', 'build']);

/**
 * Watch tasks
 */

gulp.task('watch', ['images', 'build'], () => {
    gulp.watch("assets/images/**/*", { cwd: './' }, ['images']);
    gulp.watch(config.assets.frontend.styles, ['frontend:sass']);
    gulp.watch(config.assets.frontend.scripts, ['frontend:js']);
});

gulp.task('watch:sync', ['images', 'sync'], () => {
    gulp.watch("assets/images/**/*", { cwd: './' }, ['images']);
    gulp.watch([config.assets.frontend.styles], ['frontend:sync:sass']);
    gulp.watch([config.assets.frontend.scripts], ['frontend:sync:js']);
});

gulp.task('watch:ftp', ['deploy'], () => {
    gulp.watch(["./*", config.assets.frontend.styles, config.assets.frontend.scripts], ['deploy']);
});

gulp.task('watch:all', ['images', 'build', 'build:admin'], () => {
    gulp.watch("assets/images/**/*", { cwd: './' }, ['images']);
    gulp.watch([config.assets.frontend.styles], ['frontend:sass']);
    gulp.watch([config.assets.frontend.scripts], ['frontend:js']);
    gulp.watch([config.assets.admin.styles], ['admin:sass']);
    gulp.watch([config.assets.admin.scripts], ['admin:js']);
});
