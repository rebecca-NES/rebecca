/*
Copyright 2020 NEC Solution Innovators, Ltd.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var zip = require('gulp-zip');
var clean = require('gulp-clean');
var replace = require('gulp-replace');
var chmod = require('gulp-chmod');
var concat = require('gulp-concat');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var babel = require('gulp-babel');

var path = require('path');
var fs = require('fs');

var releaseDir = path.join(__dirname, 'build');
var releaseWorkDir = path.join(releaseDir, 'release');

gulp.task('clean', function() {
    return gulp.src(releaseDir, {read: false})
        .pipe(clean());
});

gulp.task('CopyOpenfirePlugin', function(){
    var openfirePluginDestDir = releaseWorkDir;
    return gulp.src(['openfire/target/openfire/plugins/globalSNS.jar'])
        .pipe(gulp.dest(openfirePluginDestDir));
});

gulp.task('CopyNodeSource', function(){
    var nodeSourceDestDir = path.join(releaseWorkDir, 'node_src');
    return gulp.src([
            'spf/sources/node_server/src/conf/**',
            'spf/sources/node_server/src/express_app/**',
            'spf/sources/node_server/src/resources/**',
            'spf/sources/node_server/src/scripts/**',
            'spf/sources/node_server/src/package.json',
        ], {
            base: 'spf/sources/node_server/src'
        })
        .pipe(gulp.dest(nodeSourceDestDir));
});

gulp.task('CopyWebSource', function(callback){
    var webSourceDestDir = path.join(releaseWorkDir, 'web');
    var isDoneImportJsCopy = false;
    var isDoneSourceCopy = false;
    var isDoneHtmlCompress = false;
    var isDoneJSLibsCopy = false;
    var isDoneJSCompress = false;
    var isDoneJSCombine = false;
    var isLessToCSSCompress = false;
    var isDoneCryptoJSLibsCopy = false;
    var isDoneJSPluginListCopy = false;
    gulp.src([
            'spf/sources/web/**',
            '!spf/sources/web/*.html',
            '!spf/sources/web/js/**',
            '!spf/sources/web/css/styles-min.*',
            '!spf/sources/web/css/faq.*',
            '!spf/sources/web/css/*.less',
            '!spf/sources/web/test/**',
            '!spf/sources/web/test/',
            '!spf/sources/web/lcov_cobertura.py',
            '!spf/sources/web/package.json',
            '!spf/sources/web/package-lock.json',
            '!spf/sources/web/node_modules/**',
            '!spf/sources/web/node_modules',
            '!spf/sources/web/jest_0/**',
            '!spf/sources/web/jest_0'
        ])
        .pipe(gulp.dest(webSourceDestDir))
        .on('end',function() {
            isDoneSourceCopy = true;
            onEnd();
        });
    var webJsLibsSourceDestDir = path.join(webSourceDestDir, 'js/libs');
    gulp.src(['spf/sources/web/js/libs/**', '!spf/sources/web/js/libs/crypto-js/**'])
        .pipe(gulp.dest(webJsLibsSourceDestDir))
        .on('end',function() {
            isDoneJSLibsCopy = true;
            onEnd();
        });
    var webJsPluginListSourceDestDir = path.join(webSourceDestDir, 'js/plugins');
    gulp.src(['spf/sources/web/js/plugins/pluginlist'])
        .pipe(gulp.dest(webJsPluginListSourceDestDir))
        .on('end',function() {
            isDoneJSPluginListCopy = true;
            onEnd();
        });
    var webJsSourceDestDir = path.join(webSourceDestDir, 'js');
    var importJs = fs.readFileSync('spf/sources/web/js/import.js', 'utf8');
    var js_files_dirty = importJs.match(/( )*var( )*_js_files( )*=( )*\[[\s\S]*\];/);
    var js_files = eval(js_files_dirty[0].substring(js_files_dirty[0].indexOf('['), js_files_dirty[0].length-1));
    for (var i = 0, len = js_files.length; i < len; i++) {
        js_files[i] = 'spf/sources/web/' + js_files[i];
    }

    gulp.src(js_files)
        .pipe(babel({
            presets: ['es2015-nostrict']
        }))
        .pipe(concat('spf.js'))
        .pipe(uglify())
        .pipe(gulp.dest(webJsSourceDestDir))
        .on('end',function() {
            isDoneJSCombine = true;
            onEnd();
        });
    for (var i = 0, len = js_files.length; i < len; i++) {
        js_files[i] = '!' + js_files[i];
    }
    gulp.src(['spf/sources/web/js/**', '!spf/sources/web/js/plugins/pluginlist', '!spf/sources/web/js/libs/**', '!spf/sources/web/js/import.js'].concat(js_files))
        .pipe(uglify())
        .pipe(gulp.dest(webJsSourceDestDir))
        .on('end',function() {
            isDoneJSCompress = true;
            onEnd();
        });
    gulp.src(['spf/sources/web/*.html'])
        .pipe(htmlmin({
            removeComments : true,
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(webSourceDestDir))
        .on('end',function() {
            isDoneHtmlCompress = true;
            onEnd();
        });
    if(process.env.JENKINS_GULP_BUILD_ENV === 'auto_deploy_for_develop') {
        gulp.src(['spf/sources/web/js/import.js'])
            .pipe(replace(/^var( )+_cubee_version( )*=( )*('|")[^'"]+('|");?( )*$/m, 'var _cubee_version = \'' + process.env.BUILD_ID + '\';'))
            .pipe(replace(/( )*var( )*_js_files( )*=( )*\[[\s\S]*\];/, 'var _js_files = ["js/spf.js"];'))
            .pipe(uglify())
            .pipe(gulp.dest(webJsSourceDestDir))
            .on('end',function() {
                isDoneImportJsCopy = true;
                onEnd();
            });
    } else {
        gulp.src(['spf/sources/web/js/import.js'])
            .pipe(replace(/( )*var( )*_js_files( )*=( )*\[[\s\S]*\];/, 'var _js_files = ["js/spf.js"];'))
            .pipe(uglify())
            .pipe(gulp.dest(webJsSourceDestDir))
            .on('end',function() {
                isDoneImportJsCopy = true;
                onEnd();
            });
    }
    var webJsLibCryptoJsSourceDestDir = path.join(webJsLibsSourceDestDir, 'crypto-js');
    if(process.env.JENKINS_GULP_BUILD_ENV_EXPORT_CORRESPONDENCE === 'release-export-correspondence') {
        setTimeout(function() {
            isDoneCryptoJSLibsCopy = true;
            onEnd();
        },0);
    } else {
        gulp.src(['spf/sources/web/js/libs/crypto-js/**'])
            .pipe(gulp.dest(webJsLibCryptoJsSourceDestDir))
            .on('end',function() {
                isDoneCryptoJSLibsCopy = true;
                onEnd();
            });
    }
    var cssDestDir = path.join(webSourceDestDir, 'css');
    gulp.src(['spf/sources/web/css/styles-min.less', 'spf/sources/web/css/faq.less'])
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest(cssDestDir))
        .on('end',function() {
            isLessToCSSCompress = true;
            onEnd();
        });

    function onEnd() {
        if(isDoneImportJsCopy && isDoneSourceCopy && isDoneHtmlCompress && isDoneJSLibsCopy && isDoneJSCombine && isDoneJSCompress && isLessToCSSCompress && isDoneCryptoJSLibsCopy && isDoneJSPluginListCopy) {
            callback();
        }
    };
});

gulp.task('CopyProxySource', function(callback){

    var proxySourceDestDir = path.join(releaseWorkDir, 'proxy');
    var cmnConfDestDir = path.join(releaseWorkDir, 'cmnconf');

    var isDoneSrcCopy = false;
    var isDoneCmnCopy = false;

    gulp.src('CubeeProxy/src/**')
        .pipe(gulp.dest(proxySourceDestDir))
        .on('end', function() {
            isDoneSrcCopy = true;
            onProxyCopyEnd();
        });

    gulp.src('SPFCmnConf/**')
        .pipe(gulp.dest(cmnConfDestDir))
        .on('end', function() {
            isDoneCmnCopy = true;
            onProxyCopyEnd();
        });

    function onProxyCopyEnd() {
        if(isDoneSrcCopy && isDoneCmnCopy) {
            callback();
        }
    };
});

gulp.task('CompressReleas', function(){
    return gulp.src('release/**', {cwd:releaseDir})
        .pipe(zip('release.zip'))
        .pipe(gulp.dest(releaseDir));
});

gulp.task('build', ['clean'], function(){
    gulp.start('createReleaseModule');
});

gulp.task('createReleaseModule', ['CopyOpenfirePlugin', 'CopyNodeSource', 'CopyWebSource', 'CopyProxySource'], function(){
    gulp.start('CompressReleas');
});

gulp.task('default', ['build']);

gulp.task('less-compile', function() {
    var _destCssDir = path.join(__dirname, 'spf/sources/web/css');
    gulp.src(['spf/sources/web/css/styles-min.less', 'spf/sources/web/css/styles.less', 'spf/sources/web/css/faq.less'])
        .pipe(less())
        .pipe(gulp.dest(_destCssDir));
});
