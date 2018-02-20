'use strict';

import gulp from 'gulp'
import rename from 'gulp-rename';
import _ from 'lodash';
import exec from 'gulp-exec';
import {existsSync, lstatSync, readdirSync, readFile, readFileSync, rmdirSync, unlinkSync, writeFileSync} from 'fs';
import sh from 'sync-exec';
import yaml2json from 'js-yaml';

import * as path from 'path';
import {exec as execSimple} from 'child_process';

const Cite = require('citation-js');
const argv = require('minimist')(process.argv.slice(2));

argv.dir = argv.dir || "";

// convert 'dir' to absolute path assuming that 'dir' was relative to the absolute folder '__dirname'
argv.dir = path.join(__dirname, argv.dir);

const tmp = path.join(argv.dir, 'tmp');

const paths = {
    json: path.join(tmp, 'data'),
    assets: path.join(argv.dir, 'src/assets'),
    lib: path.join(argv.dir, 'lib'),
    data: path.join(__dirname, 'data'),
    config: path.join(__dirname, 'configuration'),
};

const names = {
    data: 'data.json'
};

const files = {
    markdown: [
        path.join(paths.data, '*.md')
    ],
    json: [
        path.join(tmp, 'data', '*.json')
    ],
    config: path.join(paths.config, 'comparison.yml'),
    style: path.join(paths.config, 'style.css'),
    defaultConfig: path.join(paths.config, 'comparison-default.yml'),
    description: path.join(paths.config, 'description.md'),
    mdToJsonGradle: path.join(paths.lib, 'md-to-json/build.gradle'),
    dataJson: path.join(paths.assets, names.data),
    versionInformationExample: path.join(paths.assets, 'VersionInformation.ts.example'),
    versionInformation: path.join(paths.assets, 'VersionInformation.ts'),
    gsTask: path.join(paths.lib, 'gitScrabber/task_small.yaml'),
    gsReport: path.join(paths.lib, 'gitScrabber/report.yaml')
};

// BUILD / UPDATE data files -------------------------------------<
gulp.task('assets', function () {
    return gulp.src([files.description, files.config, files.style])
        .pipe(gulp.dest(paths.assets));
});

gulp.task('determineColors', function (done) {
    const config = files.config;
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
    const foregroundArray = [
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
    let input = yaml2json.safeLoad(readFileSync(config, "utf8"));

    const data = _.cloneDeep(input).criteria || [];
    const autoCriteria = _.cloneDeep(input.autoCriteria) || {};
    let changed = false;
    let criteriaSet = new Set();
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
                    criteriaSet.add(criteriaKey);
                    criteriaCount++;
                }
            }
        })
    });

    Object.keys(autoCriteria).forEach(criteriaKey => {
        const criteria = autoCriteria[criteriaKey] || {};
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
            if (num > 0 && !criteriaSet.has(criteriaKey)) {
                criteriaCount++;
            }
        }
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
        completeAutoColor(criteriaMap);
    });

    completeAutoColor(autoCriteria);

    function completeAutoColor(cmap) {
        Object.keys(cmap).forEach((criteriaKey) => {
            const criteria = cmap[criteriaKey] || {};
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
        });
    }


    if (changed) {
        writeFileSync(config, yaml2json.safeDump(input), "utf8");
    }
    done();
});

gulp.task('versionInfo', function () {
    let versionFile = files.versionInformationExample;
    let output = files.versionInformation;
    let revision = sh('git rev-parse HEAD');
    let date = sh('git log -1 --format=%cd --date=short');
    return gulp.src(versionFile)
        .pipe(rename(output))
        .pipe(gulp.dest('.'))
        .pipe(exec('sed -i\'.bak\' "s/§§date§§/' + date.stdout.trim() + '/" ' + output))
        .pipe(exec('sed -i\'.bak\' "s/§§commit§§/' + revision.stdout.trim() + '/g" ' + output));
});

gulp.task('update-data', function () {
    gulp.watch(files.markdown, ['build-data']);
});

gulp.task('markdown', function (callback) {
    deleteFolderRecursive(paths.json);
    const gradlew = path.join(argv.dir, 'gradlew');
    execSimple(gradlew + " -q -b "
        + files.mdToJsonGradle
        + " md2json -PappArgs=\""
        + paths.data
        + ","
        + paths.json
        + ","
        + files.dataJson
        + ", 1, true\"",
        function (err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            callback(err);
        });

    function deleteFolderRecursive(folder) {
        if (existsSync(folder)) {
            readdirSync(folder).forEach(function (file) {
                const curPath = path.join(folder, file);
                if (lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    unlinkSync(curPath);
                }
            });
            rmdirSync(folder);
        }
    }
});

gulp.task('citation', function (done) {
    let input = yaml2json.safeLoad(readFileSync(files.config, "utf8"));
    let defaults = yaml2json.safeLoad(readFileSync(files.defaultConfig, "utf8"));
    const citation = input.citation || {};
    const citationDefault = defaults.citation;
    const csl = path.join(paths.data, (citation.csl || citationDefault.csl));
    const bib = path.join(paths.data, (citation.bib || citationDefault.bib));

    if (csl) {
        readFile(csl, "utf8", function (err, cslString) {
            if (err) {
                return console.error("Could not read File: ".concat(err.toString()));
            }
            Cite.CSL.register.addTemplate("defaultParameter", cslString.toString());
            readBib(done)
        });
    } else {
        console.info("Undefined 'csl' file using default!");
        readBib(done)
    }

    function readBib(done) {
        if (bib) {
            readFile(bib, "utf8", function (err, data) {
                let changed;
                if (err) {
                    return console.error("Could not read File: ".concat(err.toString()));
                }
                const cite = new Cite(data.toString().replace(/^%.*\n?/gm, ''), {forceType: 'string/bibtex'});
                let map = new Map();
                for (let item of cite.data) {
                    let itemData = new Cite(item);
                    map.set(item.id, (csl ?
                            itemData.get({
                                type: 'string',
                                style: 'citation-defaultParameter'
                            }) :
                            item.get({type: 'string'})
                        ).trim().replace(/\. \./gm, ".")
                    );
                    changed = true;
                }

                if (changed) {
                    let data = readFileSync(files.dataJson, "utf8");
                    data = data.concat(readFileSync(files.description, "utf8"));
                    let keys = new Set();
                    let keyReg = /\[@(.*?)]/g;
                    let match;
                    do {
                        match = keyReg.exec(data);
                        if (match) keys.add(match[1]);
                    } while (match);

                    keys.forEach(key => {
                        if (!map.has(key)) {
                            throw new Error("Bibtex entry for key '".concat(key, "' is missing!"));
                        }
                    });

                    let obj = Object.create(null);
                    let i = 0;
                    for (let [k, v] of map) {
                        if (data.match('@'.concat(k))) {
                            obj[k] = {index: i, value: v};
                            i++;
                        }
                    }
                    input.autoCitation = obj;
                    writeFileSync(files.config, yaml2json.safeDump(input), "utf8");
                }
                done();
            });
        } else {
            done();
        }
    }
});

gulp.task('criteria', function (done) {
    let config = yaml2json.safeLoad(readFileSync(files.config, "utf8")) || {};
    const defaultConfig = yaml2json.safeLoad(readFileSync(files.defaultConfig, "utf8"));
    const defaultCriteria = defaultConfig.autoCriteria || {};
    let criteriaObject = config.criteria || [];
    let criteria = new Map();
    criteriaObject.forEach(criteriaMap => Object.keys(criteriaMap).forEach(key => {
        const valueObject = criteriaMap[key] || {};
        const valuesObject = valueObject.values || {};
        let values = new Set();
        Object.keys(valuesObject).forEach(valueKey => values.add(valueKey));
        criteria.set(key, {type: valueObject.type || defaultConfig.criteria[0].Example.type, values: values});
    }));

    const data = JSON.parse(readFileSync(files.dataJson, "utf8")) || [];

    let autoCriteria = Object.create(null);
    data.forEach(entry => Object.keys(entry).forEach(entryKey => {
        if ("tag" === entryKey.toString() || "descr" === entryKey.toString()) {
            if (!criteria.has("id")) {
                autoCriteria["id"] = defaultCriteria.id;
            }

            if (!criteria.has("description")) {
                autoCriteria["description"] = defaultCriteria.description;
            }
            return;
        }

        const entryValue = entry[entryKey];
        if (criteria.has(entryKey) && "label" !== criteria.get(entryKey).type) {
            return;
        } else if (criteria.has(entryKey)) {
            const childs = entryValue.childs || {};
            const firstChild = childs["0"] || [];
            firstChild.forEach(array => {
                const vals = array || [];
                vals.forEach(value => {
                    const name = value.content;
                    if (!name) return;
                    if (!criteria.get(entryKey).values.has(name)) {
                        if (!autoCriteria[entryKey]) {
                            autoCriteria[entryKey] = {};
                            autoCriteria[entryKey].values = {};
                        }
                        autoCriteria[entryKey].values[name] = {};
                    }
                });

            });
        } else {
            const childs = entryValue.childs || {};
            const firstChild = childs["0"] || [];
            if (firstChild.length > 0) {
                if (firstChild[0] === "") {
                    return;
                }
                if (typeof firstChild[0] === "string") {
                    autoCriteria[entryKey] = _.cloneDeep(defaultCriteria.defaultMarkdown);
                } else {
                    if (autoCriteria[entryKey] === undefined) {
                        autoCriteria[entryKey] = _.cloneDeep(defaultCriteria.defaultLabel);
                        autoCriteria[entryKey].values = {};
                    }
                    firstChild.forEach(array => {
                        const vals = array || [];
                        vals.forEach(value => {
                            const name = value.content;
                            if (!name) return;
                            autoCriteria[entryKey].values[name] = {};
                        });
                    })
                }
            }

        }
    }));

    config.autoCriteria = autoCriteria;
    writeFileSync(files.config, yaml2json.safeDump(config), "utf8");

    done();
});

gulp.task('gitScrabber', function (done) {
    // --------------------------------------------------------
    // The git-scrabber searches for additional information for
    // libraries. These information are e.g. used encryptions
    // (hash functions, protocols, ...).
    // --------------------------------------------------------

    // The headline in the markdown under which the url to
    // a repository is given
    const urlKey = "Repository";
    // Load the data.json with the data of the libraries
    let dataJSON = yaml2json.safeLoad(readFileSync(files.dataJson, "utf8"));
    // Load the task file for the git scrabber
    let task = yaml2json.safeLoad(readFileSync(files.gsTask, "utf8"));
    // Clear projects of the task file
    task.projects = [];
    // Add urls of libraries to the projects that the git scrabber searches for
    dataJSON.forEach(library => {
        // Ignore the template library and libraries that have no url defined
        if (!library.tag.startsWith("Template") && library[urlKey]) {
            // The url is somewhere in the childs. Content is needed if
            // a - is at the beginning of the line in the markdown-file.
            let url = library[urlKey].childs[0][0][0].content;
            // TODO Improve search for url (optional)
            // If url is still undefined because there is no -
            // at the beginning of the line in the markdown-file,
            // look for the url on a higher level of childs
            let libUrl = JSON.parse('{"git": "' + url + '"}');
            task.projects.push(libUrl);
        }
    });
    // Save list with urls in task.yaml
    writeFileSync(files.gsTask, yaml2json.safeDump(task), "utf8");

    // Execute git scrabber with task.yaml
    // --> Data in report.yaml

    // ADD DATA FROM THE REPORT OF THE GIT-SCRABBER

    // Load report.yaml as json
    let reportJSON = yaml2json.safeLoad(readFileSync(files.gsReport, "utf8"));

    dataJSON.forEach(library => {
        // Only look for information of libraries that have a url.
        // Libraries without a url where not searched by the git-scrabber
        if (library[urlKey]) {

            // Get the url of the library
            let url = library[urlKey].childs[0][0][0].content;
            // Get the key of the library in the report.yaml projects
            let projectKey = getLibraryKey(reportJSON.projects, url);

            // If the library exists in the report
            if (reportJSON.projects[projectKey]) {

                // LIST WITH ATTRIBUTES
                // The values of these attributes are to be added to the libraries in data.json
                // The attributes have to be on the 3rd level in the report.yaml
                // e.g. projects.MetaDataCollector.stars
                // TODO Change this algorithm to search for these attributes in the whole report.yaml

                // ListItem = {mdKey : "KEY", gsKey: "GSKEY", task: "COLLECTIONNAME"}
                // mdKey: The name of the header in the markdown file
                // gsKey: The name of the attribute key in the report.yaml of the gitSrabber
                // task: The name of the task (task) of the gitScrabber
                let attributes = [
                    {mdKey: "Stars", gsKey: "stars", task: "MetaDataCollector"},
                    {
                        mdKey: "Development Languages", gsKey: "main_language", task: "LanguageDetector"
                    },
                ];

                // Add the values of the attributes to the data.json
                attributes.forEach(attribute => {
                    // Only add the attribute from the report if the value was not
                    // yet defined in the markdown file of the library
                    if (!library[attribute.mdKey]) {
                        // Get the data from the report
                        let atrValue = reportJSON.projects[projectKey][attribute.task][attribute.gsKey];
                        // Add the data to the library in data.json
                        let atrMap = createMapDataJSON();
                        let atrItem = createChildDataJSON(atrValue);
                        addToDataJSONMap(atrMap, atrItem);
                        library[attribute.mdKey] = atrMap;
                    }
                });

                // LIST WITH ENCRYPTION TYPES
                let encryptions = [
                    {mdKey: "Block Ciphers", gsKey: "block ciphers", collectionKey: "FeatureDetector"},
                    {mdKey: "Stream Ciphers", gsKey: "stream ciphers", collectionKey: "FeatureDetector"},
                    {mdKey: "Hash Functions", gsKey: "hash", collectionKey: "FeatureDetector"},
                    {
                        mdKey: "Encryption Modes",
                        gsKey: "encryption modes",
                        collectionKey: "FeatureDetector"
                    },
                    {
                        mdKey: "Message Authentication Codes",
                        gsKey: "message authentication codes",
                        collectionKey: "FeatureDetector"
                    },
                    {
                        mdKey: "Public Key Cryptography",
                        gsKey: "public key cryptography",
                        collectionKey: "FeatureDetector"
                    },
                    {
                        mdKey: "Public Key Infrastructure",
                        gsKey: "public key infrastructure",
                        collectionKey: "FeatureDetector"
                    },
                    {mdKey: "Protocol", gsKey: "protocol", collectionKey: "FeatureDetector"},
                ];

                encryptions.forEach(encryption => {
                    // Only add the encryption from the report if the encryption was not
                    // yet defined in the markdown file of the library
                    if (!library[encryption.mdKey]) {
                        let reportCollection = reportJSON.projects[projectKey][encryption.collectionKey][encryption.gsKey];
                        // Create a map to store the values to
                        let colMap = createMapDataJSON();
                        // For every type of encryption (of the "encryptions" list) ...
                        Object.keys(reportCollection).forEach(encryptionKey => {
                            // ... create object in the format of data.json
                            let colItem = createChildDataJSON(encryptionKey);
                            // The OCCURRENCE_THRESHOLD determines how often the
                            // attribute has to be found in the report to be added
                            // to the library
                            const OCCURRENCE_THRESHOLD = 3;
                            // Push the encryption to the list of a specific encryption type
                            if (reportCollection[encryptionKey] > OCCURRENCE_THRESHOLD) {
                                addToDataJSONMap(colMap, colItem);
                            }
                        });
                        library[encryption.mdKey] = colMap;
                    }
                });
            }
        }
    });

    // Save data in data.json
    writeFileSync(files.dataJson, JSON.stringify(dataJSON), "utf8");

    done();

    // ------------------------------------------------------
    // The following functions (between the lines)
    // provide and handle data in the format of the data.json.

    // Adds the item to the map. The map and the item have to
    // be in the format of the data.json objects
    function addToDataJSONMap(map, item) {
        map.childs[0][0].push(item);
    }

    // Adds the given value under the key to the
    // given map in the format of the object in data.json
    function createMapDataJSON() {
        return JSON.parse(
            '{"plain": "",' +
            '"childs": {' +
            '"0": [' +
            '[]' +
            ']' +
            '}' +
            '}'
        );
    }

    // Creates and returns a child in the format of data.json
    function createChildDataJSON(attributeValue) {
        if (!attributeValue || attributeValue === "") {
            return ""
        }

        // Return a child in the format of data.json objects
        return JSON.parse(
            '{' +
            '"content": "' + attributeValue + '",' +
            '"plain": "' + attributeValue + '\\n",' +
            '"plainChilds": "",' +
            '"childs": []' +
            '}'
        );
    }

    // ------------------------------------------------------

    // Returns the key to a library of a given url from
    // a list of libraries
    function getLibraryKey(list, url) {
        let key = null;
        // Look for the correct library in the report and
        // Add the information to the data.json
        Object.keys(list).forEach(projectKey => {
            // The correct library can be identified with the url
            if (list[projectKey].url === url) {
                key = projectKey;
            }
        });
        return key;
    }
});

gulp.task('build-data', gulp.series('markdown', 'gitScrabber', 'criteria', 'determineColors', 'citation', 'assets'));
// --------------------------------------------------------------->

// DEFAULT and DEV tasks -----------------------------------------<
gulp.task('default', gulp.series('build-data'));

gulp.task('dev', gulp.series('default', 'update-data'));
// --------------------------------------------------------------->
