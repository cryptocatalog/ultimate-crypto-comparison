import {readFileSync, writeFileSync} from "fs";
import {execSync} from 'child_process';
import yaml2json from "js-yaml";

export function gitScrabber(files, done) {
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

    // Creates the "plain" part of a map out of its children.
    // The plain text is needed if the type of the criteria
    // this map belongs to is markdown or text.
    function addPlainListToMap(map) {
        let plainText = "";
        map.childs[0][0].forEach(child => {
            plainText = plainText.concat("- " + child.content + "\n");
        });
        map.plain = plainText;
        return map;
    }

    // Creates the "plain" part of a map out of its children.
    // The plain text is needed if the type of the criteria
    // this map belongs to is markdown or text.
    function addPlainTextToMap(map) {
        let plainText = "";
        map.childs[0][0].forEach(child => {
            plainText = plainText.concat("" + child.content + "\n");
        });
        map.plain = plainText;
        return map;
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
            '"plain": "' + attributeValue + '",' +
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
                releaseMap = addPlainTextToMap(releaseMap);
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

                                // If the report really contained information about
                                // the attribute..
                                if (Object.keys(attrMapDataJSON.childs[0][0]).length > 0) {
                                    // Create the "plain" part of the map
                                    switch (reportAttr.constructor) {
                                        case (Number || String):
                                            attrMapDataJSON = addPlainTextToMap(attrMapDataJSON);
                                            break;
                                        case (Array || Object):
                                            attrMapDataJSON = addPlainListToMap(attrMapDataJSON);
                                            break;
                                        default:
                                            console.log("Attribute has no valid type");
                                    }
                                    // Add map to data.json
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
}
