'use strict';

import gulp from 'gulp'
import rename from 'gulp-rename';
import _ from 'lodash';

import jsontransform from 'gulp-json-transform';
import concatjson from 'gulp-concat-json';
import clean from 'gulp-clean';
import run from 'run-sequence';
import exec from 'gulp-exec';
import bibtex2json from './citation/bibtex2json';
import fs from 'fs';
import sh from 'sync-exec';
import yaml2json from 'js-yaml';

const execSimple = require('child_process').exec;

const paths = {
    src: 'app',
    dev: 'www',
    json: 'comparison-elements-json',
    markdown: 'comparison-elements',
    data: 'app/components/comparison/data/'
};

const files = {
    data: [
        './app/components/comparison/data/*.json',
        './comparison-configuration/*',
        './citation/output/*',
        './favicon.ico'
    ],
    markdown: [
        './comparison-elements/*.md'
    ],
    json: [
        './comparison-elements-json/*.json'
    ]
};

const destfiles = {
    index: './www'
};

// BUILD / UPDATE data files -------------------------------------<
gulp.task('build-data', function (callback) {
    run('determinecolors', 'markdown', 'json', 'citation', callback);
});

gulp.task('determinecolors', function () {
    const config = './comparison-configuration/comparison.yml';
    const colorArray = [
        'hsl(15, 100%, 70%)',
        'hsl(30, 100%, 70%)',
        'hsl(45, 100%, 70%)',
        'hsl(60, 100%, 70%)',
        'hsl(75, 100%, 70%)',
        'hsl(90, 100%, 70%)',
        'hsl(105, 100%, 70%)',
        'hsl(120, 100%, 70%)',
        'hsl(135, 100%, 70%)',
        'hsl(150, 100%, 70%)',
        'hsl(165, 100%, 70%)',
        'hsl(180, 100%, 70%)',
        'hsl(195, 100%, 70%)',
        'hsl(210, 100%, 70%)',
        'hsl(225, 100%, 70%)',
        'hsl(240, 100%, 70%)',
        'hsl(255, 100%, 70%)',
        'hsl(270, 100%, 70%)',
        'hsl(285, 100%, 70%)',
        'hsl(300, 100%, 70%)',
        'hsl(315, 100%, 70%)',
        'hsl(330, 100%, 70%)'
    ];
    var foregroundArray = [
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d",
        "#ffff00",
        "#ffff00",
        "#ffff00",
        "#ffff00",
        "#ffff00",
        "#0d0d0d",
        "#0d0d0d",
        "#0d0d0d"
    ];
    let color;
    let input = yaml2json.safeLoad(fs.readFileSync(config, "utf8"));

    const data = _.cloneDeep(input).criteria || [];
    console.log(JSON.stringify(data));
    let changed = false;
    let criteriaValueCount = 0;
    let criteriaCount = 0;

    data.forEach((map) => {
        const criteriaMap = map || new Map;
        Object.keys(criteriaMap).forEach((criteriaKey) => {
            const criteria = criteriaMap[criteriaKey] || {};
            if (criteria.type === "label" || criteria.type === undefined) {
                const values = criteria.values || [];
                let num = 0;
                Object.keys(values).forEach(valueKey => {
                    const value = values[valueKey] || {};
                    if (value.class === undefined && value.color === undefined && value.backgroundColor === undefined) {
                        criteriaValueCount++;
                        num++;
                    }
                });
                if (num > 0) {
                    criteriaCount++;
                }
            }
        })
    });

    let delta = Math.floor(colorArray.length / criteriaValueCount);
    let columnDelta;
    if (delta < 1) {
        columnDelta = Math.floor(colorArray.length / criteriaCount);
    } else {
        columnDelta = 0;
    }

    color = Math.floor(Math.random() * colorArray.length);

    input.autoColor = input.autoColor || {};
    let autoColor = input.autoColor;

    data.forEach((map) => {
        const criteriaMap = map || new Map;
        Object.keys(criteriaMap).forEach((criteriaKey) => {
            const criteria = criteriaMap[criteriaKey] || {};
            if (criteria.type === "label" || criteria.type === undefined) {
                const values = criteria.values || [];
                let tmpValues = [];
                Object.keys(values).forEach((key) => {
                    const value = values[key] || {};
                    if (value.class === undefined && value.color === undefined && value.backgroundColor === undefined) {
                        let obj = value;
                        obj.name = key;
                        tmpValues.push(obj);
                    }
                });

                if (tmpValues[0] && tmpValues[0].weight === undefined) {
                    tmpValues.sort((val1, val2) => {
                        const name1 = val1.name || "";
                        const name2 = val2.name || "";
                        return name1.toString().localeCompare(name2.toString());
                    })
                } else {
                    // TODO support order in config (ASC|DESC)
                    let weight = 1;
                    tmpValues.sort((val1, val2) => {
                        const weight1 = val1.weight || 0;
                        const weight2 = val2.weight || 0;
                        return weight * (weight1 - weight2);
                    });
                }
                if (tmpValues.length > 0) {
                    autoColor[criteriaKey] = autoColor[criteriaKey] || {};
                }

                tmpValues.forEach(value => {
                    if (!autoColor[criteriaKey][value.name]) {
                        changed = true;
                        autoColor[criteriaKey][value.name] = {
                            color: foregroundArray[color],
                            backgroundColor: colorArray[color]
                        };
                        color = (color + delta) % colorArray.length;
                    }
                });
                color = (color + columnDelta) % colorArray.length;
            }
        })
    });

    if (changed) {
        fs.writeFileSync(config, yaml2json.safeDump(input), "utf8");
    }
    return true;
});

gulp.task('versioninfo', function () {
    let versionfile = './app/VersionInformation.ts.example';
    let output = './app/VersionInformation.ts';
    let revision = sh('git rev-parse HEAD');
    let date = sh('git log -1 --format=%cd --date=short');
    return gulp.src(versionfile)
        .pipe(rename(output))
        .pipe(gulp.dest('.'))
        .pipe(exec('sed -i\'.bak\' "s/§§date§§/' + date.stdout.trim() + '/" ' + output))
        .pipe(exec('sed -i\'.bak\' "s/§§commit§§/' + revision.stdout.trim() + '/g" ' + output));
});

gulp.task('update-data', function () {
    gulp.watch(files.markdown, ['build-data']);
});

gulp.task('markdown', function (callback) {
    const isWin = /^win/i.test(process.platform);
    if (isWin) {
        execSimple("gradlew -q -b ./app/java/md-to-json/build.gradle md2json -PappArgs=\"" + __dirname + "/" + paths.markdown + "/," + __dirname + "/" + paths.json + "/, 1, true\"", function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            callback(err);
        });
    } else {
        execSimple("./gradlew -q -b ./app/java/md-to-json/build.gradle md2json -PappArgs=\"" + __dirname + "/" + paths.markdown + "/," + __dirname + "/" + paths.json + "/, 1, true\"", function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            callback(err);
        });
    }
});

gulp.task('json', function () {
    return gulp.src(files.json)
        .pipe(concatjson("data.json"))
        .pipe(jsontransform(function (data) {
            return data;
        }, 2))
        .pipe(gulp.dest(paths.data))
});

gulp.task('citation', function (callback) {
    let fileContent = JSON.parse(fs.readFileSync("./citation/config.json", "utf8"));
    bibtex2json.parse('./citation/' + fileContent.bibtex_file, 'utf8', './citation/' + fileContent.bibtex_style, './citation/output', callback);
});
// --------------------------------------------------------------->


// BUILD / UPDATE www folder -------------------------------------<
gulp.task('build-www', ['data'], function () {
});

gulp.task('update-www', function () {
    gulp.watch(files.data, ['data']);
});

gulp.task('data', function () {
    return gulp.src(files.data, {base: '.'})
        .pipe(gulp.dest(destfiles.index));
});
// --------------------------------------------------------------->

// DELETE www folder ---------------------------------------------<
gulp.task('delete-www', function () {
    return gulp.src(paths.dev, {read: false})
        .pipe(clean());
});
// --------------------------------------------------------------->

// DEFAULT and DEV tasks -----------------------------------------<
gulp.task('default', function (callback) {
    run('build-data', 'delete-www', 'build-www', callback);
});

gulp.task('dev', ['default'], function (callback) {
    run('update-data', 'update-www', callback);
});
// --------------------------------------------------------------->
