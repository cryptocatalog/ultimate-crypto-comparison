import gulp from 'gulp'
import _ from 'lodash';
import exec from 'gulp-exec';
import {existsSync, lstatSync, readdirSync, readFile, readFileSync, rmdirSync, unlinkSync, writeFileSync} from 'fs';
import yaml2json from 'js-yaml';
import request from 'sync-request';
import moment from 'moment';

import * as path from 'path';
import {exec as execSimple, execSync} from 'child_process';

const Cite = require('citation-js');
const argv = require('minimist')(process.argv.slice(2));
const downloadMap = {};

argv.dir = argv.dir || "";

const ucBaseRoot = __dirname.replace(path.join("lib", "gulp"), "");
const ucRoot = __dirname.replace(path.join(argv.dir, "lib", "gulp"), "");

const tmp = path.join(ucRoot, 'tmp');
const lib = path.join(ucBaseRoot, 'lib');

const paths = {
    json: path.join(tmp, 'data'),
    assets: path.join(ucBaseRoot, 'src/assets'),
    data: path.join(ucRoot, 'data'),
    config: path.join(ucRoot, 'configuration'),
    mdToJson: path.join(lib, "md-to-json")
};

const names = {
    data: 'data.json',
    versionInformation: 'VersionInformation.ts'
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
    mdToJsonGradle: path.join(lib, 'md-to-json/build.gradle'),
    dataJson: path.join(paths.assets, names.data),
    versionInformation: path.join(paths.assets, names.versionInformation),
    gsTask: path.join(lib, 'gitScrabber/task_cryptocatalog.yaml'),
    gsReport: path.join(lib, 'gitScrabber/report.yaml'),
    gsExec: path.join(lib, 'gitScrabber/gitScrabber/gitScrabber/gitScrabber.py'),
    gsLibs: path.join(lib, 'gitScrabber/libs'),
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

/*
gulp.task('versionInformation', function () {
    const version = argv.tag;
    console.log(version);
    return gulp.src(files.versionInformation)
        .pipe(gulp.dest(paths.assets))
        .pipe(exec('sed -i\'.bak\' "s/tagDate = \\".*\\"/tagDate = \\"$(git log --tags -1 --simplify-by-decoration --pretty="format:%cd" --date=short)\\"/g" ' + files.versionInformation))
        .pipe(exec('sed -i\'.bak\' "s/tag = \\".*\\"/tag = \\"$(git describe --abbrev=0 --tags)\\"/g" ' + files.versionInformation));
});
*/

gulp.task('release', function () {
    const version = argv.tag;
    const date = moment().format("YYYY-MM-DD");
    if (typeof(version) === 'undefined' || version === null || version === 'undefined') {
        throw new Error('Undefined argument tag use: `npm run release -- --tag=x.x.x`');
    }
    return gulp.src(files.versionInformation)
        .pipe(gulp.dest(paths.assets))
        .pipe(exec('sed -i\'.bak\' "s/tag = \\".*\\"/tag = \\"v' + version + '\\"/g" ' + files.versionInformation))
        .pipe(exec('sed -i\'.bak\' "s/tagDate = \\".*\\"/tagDate = \\"' + date + '\\"/g" ' + files.versionInformation))
        .pipe(exec('sed -i\'.bak\' -E "s/(tagLink = \\".*)\\/v.*\\"/\\1\\/v' + version + '\\"/" ' + files.versionInformation));
});

gulp.task('update-data', function () {
    gulp.watch(files.markdown, ['build-data']);
});

gulp.task('markdown', function (callback) {
    deleteFolderRecursive(paths.json);
    const gradlew = path.join(paths.mdToJson, 'gradlew');
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

gulp.task('gitScrabber', function (done) {
    // --------------------------------------------------------
    // The git-scrabber searches for additional information for
    // libraries. These information are e.g. used encryptions
    // (hash functions, protocols, ...).
    // --------------------------------------------------------

    const repoKey = "Repository";
    const downloadKey = "Download";
    const releaseKey = "Release";

    // Load the data.json with the data of the libraries
    let dataJSON = yaml2json.safeLoad(readFileSync(files.dataJson, "utf8"));

    addLibrariesToTask();
    executeGitScrabber();
    addDataToLibraries();
    done();

    // ------------------------------------------------------
    // The following functions (between the ---- lines)
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

    // FUNCTIONS TO CHECK IF THE MARKDOWN CONTAINS A SPECIFIC KEY

    // Returns the url of the library.
    // If the library has an "download" url specified
    // return the download url.
    // Else if the library has an repository url
    // return the url to the repository.
    function getUrlOfLibrary(library) {
        let url = null;
        if (libraryHasDownloadUrl(library)) {   // Download link specified -> use this link
            url = library[downloadKey].childs[0][0][0].content;
        } else if (libraryHasRepository(library)) { // Repository specified -> use this link
            url = library[repoKey].childs[0][0][0].content;
        }
        return url;
    }

    // Returns whether the library has a defined repository url
    // Returns true if the library has a repository url.
    // Returns false if the library is the template library or
    // if the library does not have a repository url.
    function libraryHasRepository(library) {
        return !library.tag.startsWith("Template") && library[repoKey] && library[repoKey].childs[0][0];
    }

    function libraryHasDownloadUrl(library) {
        return !library.tag.startsWith("Template") && library[downloadKey] && library[downloadKey].childs[0][0];
    }

    function applicableLibraryHasReleaseTag(library) {
        return !library.tag.startsWith("Template") && library[releaseKey] && library[releaseKey].childs[0][0];
    }

    function isArchive(url) {
        return url.endsWith(".zip") || url.endsWith(".rar");
    }

    // Adds the libraries of the data folder to the task.yaml of the git-scrabber.
    // If the library has a download url specified, use the download url.
    // If the library has a repository url specified and no download url, use the repository url.
    // If the library has no url, do not add this library to the task.yaml.
    function addLibrariesToTask() {
        // Load the task file for the git scrabber
        let task = yaml2json.safeLoad(readFileSync(files.gsTask, "utf8"));
        // Clear projects of the task file
        task.projects = [];
        // Add urls of libraries to the projects that the git scrabber searches for
        dataJSON.forEach(library => {
            let url = getUrlOfLibrary(library);
            // Ignore the template library and libraries that have no url defined
            if (url) {
                // If url is still undefined because there is no -
                // at the beginning of the line in the markdown-file,
                // look for the url on a higher level of childs
                let taskUrl;
                if (isArchive(url)) {
                    taskUrl = JSON.parse('{"archive": "' + url + '"}');
                } else {
                    taskUrl = JSON.parse('{"git": "' + url + '"}');
                }
                // TODO Add existing data to generalData in task.yaml (optional)
                // This allows the git scrabber to compute additional values
                // e.g. the impact
                task.projects.push(taskUrl);
            }
        });
        // Save list with urls in task.yaml
        writeFileSync(files.gsTask, yaml2json.safeDump(task), "utf8");

    }

    // EXECUTE GIT SCRABBER
    function executeGitScrabber() {

        execSync('mkdir -p ' + gitScrabberLibs);

        execSync('python ' + files.gsExec +
            ' -r ' + files.gsReport +
            ' -t ' + files.gsTask +
            ' -o ' + files.gsReport +
            ' -d ' + files.gsLibs +
            ' -f' +
            ' --github-token 8341094f6dc4944ee22491139c5565c3e6f5e32e',

            function (err, stdout, stderr) {
                console.log(stdout);
                console.log(stderr);
                done(err);
            });

    }

    // ADD ADDITIONAL DATA TO THE LIBRARIES THAT WAS NOT SPECIFIED IN THE MARKDOWN FILES
    function addDataToLibraries() {

        dataJSON.forEach(library => {

            // |-----------------------------------------------------------------|
            // | ADD DATA TO THE DATA.JSON THAT DOES NOT RELY ON THE REPORT.YAML |
            // |-----------------------------------------------------------------|

            // Add release tag
            if (!applicableLibraryHasReleaseTag(library)) {
                let releaseMap = createMapDataJSON();
                let tag = getReleaseTag(library);
                let releaseItem = createChildDataJSON(tag);
                addToDataJSONMap(releaseMap, releaseItem);
                library[releaseKey] = releaseMap;
            }

            function getReleaseTag(library) {
                const tagUnknown = "Unknown";
                const tagLatest = "Latest";

                let url = getUrlOfLibrary(library);

                if (url && isArchive(url)) { // Archive -> get release name from url
                    // ONLY WORKS FOR LINKS TO GITHUB RELEASES ARCHIVES
                    let trimmedUrl = url.slice(0, -4); // Remove .zip/.rar from end of url
                    let urlParts = trimmedUrl.split("/");
                    return urlParts[urlParts.length - 1];

                } else if (url && !isArchive(url)) { // Repository -> "Latest" -tag
                    return tagLatest;
                }

                return tagUnknown;
            }

            // TODO Add link to issue/pull request page if a header does not contain any content

            // |-----------------------------------------------------------------|
            // | ADD DATA TO THE DATA.JSON THAT RELIES ON THE REPORT.YAML |
            // |-----------------------------------------------------------------|

            // Load report.yaml as json
            let reportJSON = yaml2json.safeLoad(readFileSync(files.gsReport, "utf8"));

            // Get the url of the library from data.json
            let url = getUrlOfLibrary(library);

            // Only look for information of libraries that have a url.
            // Libraries without a url where not searched by the git-scrabber
            if (url) {

                // Get the key of the library in the report.yaml projects
                let projectKey = getLibraryKey(reportJSON.projects, url);
                // If the library exists in the report
                if (reportJSON.projects[projectKey]) {

                    // List with attributes to search for in the report
                    // (mdKey, gsKey, task)
                    // The order defines the order in the details view of a library
                    let attributes = [
                        {mdKey: "Development Languages", gsKey: "languages", task: "LanguageDetector"},
                        {mdKey: "Stars", gsKey: "stars", task: "MetaDataCollector"},
                        {mdKey: "Block Ciphers", gsKey: "block ciphers", task: "FeatureDetector"},
                        {mdKey: "Stream Ciphers", gsKey: "stream ciphers", task: "FeatureDetector"},
                        {mdKey: "Hash Functions", gsKey: "hash", task: "FeatureDetector"},
                        {
                            mdKey: "Encryption Modes",
                            gsKey: "encryption modes",
                            task: "FeatureDetector"
                        },
                        {
                            mdKey: "Message Authentication Codes",
                            gsKey: "message authentication codes",
                            task: "FeatureDetector"
                        },
                        {
                            mdKey: "Public Key Cryptography",
                            gsKey: "public key cryptography",
                            task: "FeatureDetector"
                        },
                        {
                            mdKey: "Public Key Infrastructure",
                            gsKey: "public key infrastructure",
                            task: "FeatureDetector"
                        },
                        {mdKey: "Protocol", gsKey: "protocol", task: "FeatureDetector"},
                    ];

                    attributes.forEach(attribute => {

                        let reportTask = reportJSON.projects[projectKey][attribute.task];
                        if (!library[attribute.mdKey] && reportTask) {

                            let reportAttr = reportJSON.projects[projectKey][attribute.task][attribute.gsKey];
                            if (reportAttr) {

                                let attrMapDataJSON = createMapDataJSON();
                                switch (reportAttr.constructor) {
                                    case (Number || String):      // Number or String type in report (e.g. stars)

                                        let attrItem = createChildDataJSON(reportAttr);
                                        addToDataJSONMap(attrMapDataJSON, attrItem);
                                        break;

                                    case (Array):       // Array type in report (e.g. languages)

                                        Object.keys(reportAttr).forEach(attrElement => {
                                            let attrItem = createChildDataJSON(reportAttr[attrElement]);
                                            addToDataJSONMap(attrMapDataJSON, attrItem);
                                        });
                                        break;

                                    case (Object):    // JSON Object (Used for encryptions)

                                        const OCCURRENCE_THRESHOLD = 1;
                                        Object.keys(reportAttr).forEach(attrElement => {
                                            let attrItem = createChildDataJSON(attrElement);
                                            if (reportAttr[attrElement] >= OCCURRENCE_THRESHOLD) {
                                                addToDataJSONMap(attrMapDataJSON, attrItem);
                                            }
                                        });
                                        break;

                                    default:
                                        console.log("Attribute has no valid type");
                                }

                                // Only add the map to the data.json if the
                                // report really contained information about
                                // the attribute
                                if (Object.keys(attrMapDataJSON.childs[0][0]).length > 0) {
                                    library[attribute.mdKey] = attrMapDataJSON;
                                }
                            }
                        }
                    });
                }
            }
        });

        // Save data in data.json
        writeFileSync(files.dataJson, JSON.stringify(dataJSON), "utf8");
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
                if ((data || "").replace(/([^%]*)(%[^\n]*)([^%]*)/, "$1$3").trim().length === 0) {
                    input.autoCitation = {};
                    writeFileSync(files.config, yaml2json.safeDump(input), "utf8");
                    return done();
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

gulp.task('development-column', function (done) {
    const yaml = yaml2json.safeLoad(readFileSync(path.join(paths.assets, 'comparison.yml')));
    let crit = null;
    let critKey = null;

    for (const criteria of (yaml.criteria || [])) {
        if (criteria === null || criteria === undefined) {
            continue;
        }
        for (const criteriaKey of Object.keys(criteria)) {
            const criteriaValue = criteria[criteriaKey];
            if (criteriaValue !== null
                && criteriaValue !== undefined
                && criteriaValue.hasOwnProperty("type")
                && criteriaValue.type === 'repository') {

                crit = criteriaValue;
                critKey = criteriaKey;
            }
        }
    }
    if (crit === null) {
        done();
        return;
    }
    crit.type = 'label';
    crit.search = true;
    const allData = JSON.parse(readFileSync(path.join(paths.assets, 'data.json')));
    const queryDate = moment().format("YYYY-MM-DDTHH:mm:ss");
    for (const data of allData) {
        let link = data[critKey].plain.trim();
        if (link.startsWith('-')) {
            link = link.substr(1).trim();
        }
        if (link.length !== 0) {
            const commits = getCommit(link);
            if (commits.length === 0) {
                continue;
            }
            const labels = getLabels(commits[0], crit, link, queryDate);
            data[critKey] = {
                plain: labels.map(l => "- " + l.plain).join(''),
                childs: {
                    0: [
                        labels
                    ]
                }
            };
        }
    }
    writeFileSync(path.join(paths.assets, 'data.json'), JSON.stringify(allData), 'utf8');
    writeFileSync(path.join(paths.assets, 'comparison.yml'), yaml2json.safeDump(yaml), 'utf8');
    done();
});

gulp.task('build-data', gulp.series('markdown', 'gitScrabber', 'criteria', 'determineColors', 'citation',
    'assets', 'development-column'));
// --------------------------------------------------------------->

// DEFAULT and DEV tasks -----------------------------------------<
gulp.task('default', gulp.series('build-data'));

gulp.task('dev', gulp.series('default', 'update-data'));

// --------------------------------------------------------------->

function getCommit(link) {
    const githubApi = 'https://api.github.com/repos/{owner}/{repo}/commits';
    link = link.toLowerCase();
    if (downloadMap.hasOwnProperty(link)) {
        return downloadMap[link];
    }
    if (link.indexOf('github.com') > -1) {
        const splits = link.split('/');
        const owner = splits[splits.length - 2];
        const repo = splits[splits.length - 1];
        const query = githubApi.replace("{owner}", owner).replace("{repo}", repo);
        const res = request('GET', query, {
            headers: {
                "user-agent": "hueneburg"
            }
        });
        const commit = JSON.parse(res.getBody('utf-8'));
        downloadMap[link] = commit;
        return commit;
    }
    return [];
}

function getLabels(commit, repository, link, queryDate) {
    const now = moment();
    const date = moment(commit.commit.author.date);
    const labels = [];
    for (const key of Object.keys(repository.values || [])) {
        const label = repository.values[key];
        const minDiff = now.diff(date, label.minAgeUnit);
        const maxDiff = now.diff(date, label.maxAgeUnit);
        if ((minDiff >= label.minAge || label.minAge === undefined || label.minAge === -1)
            && (maxDiff < label.maxAge || label.maxAge === undefined || label.maxAge === -1)) {
            labels.push({
                content: key,
                plain: key + '\n',
                plainChilds: "    - <" + link + ">\n    - " + queryDate,
                childs: []
            })
        }
    }
    return labels;
}
