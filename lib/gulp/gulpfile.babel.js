import gulp from 'gulp'
import exec from 'gulp-exec';
import moment from 'moment';
import * as path from 'path';
import {exec as execSimple, execSync} from 'child_process';

import {citation} from './tasks/citation.babel';
import {determineColors} from "./tasks/determineColors.babel";
import {deleteFolderRecursive} from "./tasks/util.babel";
import {criteria} from "./tasks/criteria.babel";
import {developmentColumn} from "./tasks/developmentColumn.babel";

const argv = require('minimist')(process.argv.slice(2));
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
    versionInformation: 'VersionInformation.ts',
    config: 'comparison.yml',
    autoConfig: 'comparison-auto-config.yml'
};

const files = {
    markdown: [
        path.join(paths.data, '*.md')
    ],
    json: [
        path.join(tmp, 'data', '*.json')
    ],
    config: path.join(paths.config, names.config),
    style: path.join(paths.config, 'style.css'),
    defaultConfig: path.join(paths.config, 'comparison-default.yml'),
    description: path.join(paths.config, 'description.md'),
    mdToJsonGradle: path.join(lib, 'md-to-json/build.gradle'),
    dataJson: path.join(paths.assets, names.data),
    assetsConfig: path.join(paths.assets, names.autoConfig),
    autoConfig: path.join(paths.config, names.autoConfig),
    versionInformation: path.join(paths.assets, names.versionInformation),
    gsTask: path.join(lib, 'gitScrabber/task_cryptocatalog.yaml'),
    gsReport: path.join(lib, 'gitScrabber/report.yaml'),
    gsExec: path.join(lib, 'gitScrabber/gitScrabber/gitScrabber/gitScrabber.py'),
    gsLibs: path.join(lib, 'gitScrabber/libs'),
};

const globs = {
    markdown: path.join(paths.data, '/**/', '*.md'),
    config: path.join(paths.config, names.config),
    defaultConfig: path.join(paths.config, '/**/', names.config),
    description: path.join(paths.config, '/**/', 'description.md'),
    style: path.join(paths.config, '/**/', 'style.css'),
    bib: path.join(paths.data, '/**/', '*.bib'),
    csl: path.join(paths.data, '/**/', '*.csl')
};

// BUILD / UPDATE data files -------------------------------------<
function assets() {
    return gulp.src([files.description, files.autoConfig, files.style])
        .pipe(gulp.dest(paths.assets));
}

function colors(done) {
    determineColors(files, done);
}

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

function markdown(callback) {
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
}

function changeCitation(done) {
    citation(paths, files, done);
}

function changeCriteria(done) {
    criteria(files, done);
}

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

        // Try to create a new directory, if there is already one go on.
        try{
            execSync('mkdir -p ' + files.gsLibs);
        }
        catch(err){
            console.log(err.message);
        }

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
                        {mdKey: "Protocols", gsKey: "protocol", task: "FeatureDetector"},
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

gulp.task('cve-info', function (done) {
    // --------------------------------------------------------
    // This task is using the API of www.circl.lu to obtain
    // information about the Common Vulnerabilities and
    // Exposures of each listed library.
    // --------------------------------------------------------

    const vendorKey = "CVE Vendor";
    const productKey = "CVE Product";
    const summaryKey = "summary";
    const dataSummaryKey = "CVE Details";

    // Load the data.json with the data of the libraries
    let dataJSON = yaml2json.safeLoad(readFileSync(files.dataJson, "utf8"));

    getCveDetailsFromApi();

    done();


    // Adds the item to the map. The map and the item have to
    // be in the format of the data.json objects
    function addToDataJSONMap(map, item) {
        map.childs[0][0].push(item);
    }

    // Adds the given value under the key to the
    // given map in the format of the object in data.json
    function createMapDataJSON(attributeValue) {
        return JSON.parse(
            '{"plain": "' + attributeValue + '\\u0000",' +
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
                '"plain": "' + attributeValue + '\\u0000",' +
                '"plainChilds": "",' +
                '"childs": []' +
                '}'
            );
    }

    // Returns whether the library has a defined CVE vendor
    // Returns true if the library has a CVE vendor.
    // Returns false if the library is the template library or
    // if the library does not have a CVE vendor.
    function libraryHasVendor(library) {
        return !library.tag.startsWith("Template") && library[vendorKey] && library[vendorKey].childs[0][0];
    }
    function libraryHasProduct(library) {
        return !library.tag.startsWith("Template") && library[productKey] && library[productKey].childs[0][0];
    }

    // Returns the CVE vendor is it is specified.
    // Returns null if it is not specified.
    function getVendorOfLibrary(library) {
        let vendor = null;
        if (libraryHasVendor(library)) {   // Vendor is specified
            vendor = library[vendorKey].childs[0][0][0].content;
        }
        return vendor;
    }

    function getProductOfLibrary(library) {
        let product = null;
        if (libraryHasProduct(library)) {   // CVE Product is specified
            product = library[productKey].childs[0][0][0].content;
        }
        return product;
    }

    function getSummaryOfApiResponse(apiResponse){
        let summary = null;
        if (apiResponse[0].summary){
            summary = apiResponse[0].summary;
        }
        return summary;
    }

    function getJsonFromApi(url){
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        var httpReq = new XMLHttpRequest();
        httpReq.open( "GET" , url, false);
        httpReq.send(null);
        return JSON.parse(httpReq.responseText);
    }


    function getCveDetailsFromApi(){

        dataJSON.forEach(library => {

            let vendor = getVendorOfLibrary(library);
            let product = getProductOfLibrary(library);

            // Ignore the template library and libraries that have no vendor and product defined.
            if (vendor && product) {
                // Built the url for the API request.
                let url = "https://cve.circl.lu/api/search/" + vendor + "/" + product;

                var jsonFromApi = getJsonFromApi(url);

                let summary = getSummaryOfApiResponse(jsonFromApi);

                // Clean the summary from unintentional chars
                let cleanSummary = summary.replace('\"', '');
                cleanSummary = cleanSummary.replace('"', '');

                // If there is a summary save it in the data.json.
                if(summary){
                    let summaryMap = createMapDataJSON(cleanSummary);
                    let summaryItem = createChildDataJSON(cleanSummary);
                    addToDataJSONMap(summaryMap, summaryItem);
                    library[dataSummaryKey] = summaryMap;
                }
            }

        });

        // Save data in data.json
        writeFileSync(files.dataJson, JSON.stringify(dataJSON), "utf8");

    }

});

gulp.task('development-column', function (done) {
    developmentColumn(files, done);
});
// --------------------------------------------------------------->

// DEFAULT task --------------------------------------------------<
gulp.task('default', gulp.series(markdown, 'gitScrabber', 'cve-info', changeCriteria, colors, changeCitation, 'development-column', assets));
// --------------------------------------------------------------->

// DEVELOPMENT tasks --------------------------------------------------<
gulp.task('update-data', function () {
    gulp.watch(globs.markdown, gulp.series('default'));
});

gulp.task('update-config', function () {
    gulp.watch([globs.config, globs.defaultConfig], gulp.series(changeCriteria, colors, changeCitation, assets));
});

gulp.task('update-description', function () {
    gulp.watch(globs.description, gulp.series(changeCitation, assets));
});

gulp.task('update-style', function () {
    gulp.watch(globs.style, assets);
});

gulp.task('update-citation', function () {
    gulp.watch([globs.csl, globs.bib], gulp.series(changeCitation, assets));
});

gulp.task('update', gulp.parallel('update-data', 'update-config', 'update-description', 'update-citation', 'update-style'));

gulp.task('dev', gulp.series('default', 'update'));
// --------------------------------------------------------------->
