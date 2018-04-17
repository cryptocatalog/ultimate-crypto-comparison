import {readFileSync, writeFileSync} from "fs";
import {execSync} from 'child_process';
import yaml2json from "js-yaml";

// List with attributes to search for in the report
// (mdKey, gsKey, task)
// The order defines the order in the details view of a library
let ATTRIBUTES = [
    {mdKey: "Development Languages", gsKey: "languages", task: "LanguageDetector"},
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

// These values will be added to the "metadata" section instead
// of having their own section.
// MetadataKey is the name of the attribute in the list of metadata.
let METADATA = [
    {metadataKey: "Stars", gsKey: "stars", task: "MetaDataCollector"},

];

const REPO_KEY = "Repository";
const ARCHIVE_KEY = "Archive";
const METADATA_KEY = "Metadata";
const RELEASE_KEY = "Release";

export function gitScrabber(files, done) {
    // --------------------------------------------------------
    // The git-scrabber searches for additional information for
    // libraries. These information are e.g. used encryptions
    // (hash functions, protocols, ...).
    // --------------------------------------------------------

    // Load the data.json with the data of the libraries
    let dataJSON = yaml2json.safeLoad(readFileSync(files.dataJson, "utf8"));

    addLibrariesToTask(files, dataJSON);
    executeGitScrabber(files);
    addDataToLibraries(files, dataJSON);

    done();
}

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
// If the library has an "archive" url specified
// return the archive url.
// Else if the library has an repository url
// return the url to the repository.
function getUrlOfLibrary(library) {
    let url = null;
    if (libraryHasArchiveUrl(library)) {   // Archive link specified -> use the archive link
        url = library[ARCHIVE_KEY].childs[0][0][0].content;
    } else if (libraryHasRepository(library)) { // Repository specified -> use the repo link
        url = library[REPO_KEY].childs[0][0][0].content;
    }
    return url;
}

// Returns whether the library has a defined repository url
// Returns true if the library has a repository url.
// Returns false if the library is the template library or
// if the library does not have a repository url.
function libraryHasRepository(library) {
    return !library.tag.startsWith("Template") && library[REPO_KEY] && library[REPO_KEY].childs[0][0];
}

function libraryHasArchiveUrl(library) {
    return !library.tag.startsWith("Template") && library[ARCHIVE_KEY] && library[ARCHIVE_KEY].childs[0][0];
}

function isArchive(url) {
    return url.endsWith(".zip") || url.endsWith(".rar");
}

// Adds the libraries of the data folder to the task.yaml of the git-scrabber.
// If the library has a archive url specified, use the archive url.
// If the library has a repository url specified and no archive url, use the repository url.
// If the library has no url, do not add this library to the task.yaml.
function addLibrariesToTask(files, dataJSON) {
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

// Execute the git scrabber
function executeGitScrabber(files) {

    // Try to create a new directory, if there is already one go on.
    try {
        execSync('mkdir -p ' + files.gsLibs);
    }
    catch (err) {
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
function addDataToLibraries(files, dataJSON) {

    dataJSON.forEach(library => {

        // Get the url of the library from data.json
        let url = getUrlOfLibrary(library);
        // Only look for information of libraries that have a url.
        // Libraries without a url where not searched by the git-scrabber
        if (url) {


            // If metadata is not yet defined in the data.json file, create the list
            if (!library[METADATA_KEY]) {
                library[METADATA_KEY] = createMapDataJSON();
            }

            // Add release tag to metadata list if not yet defined
            if (!metaDataListContainsItem(library[METADATA_KEY], RELEASE_KEY)) {
                addReleaseTagToMetaDataList(library);
            }

            // Add name of release to library.tag in data.json
            if (isArchive(url)) {
                let libTagParts = library.tag.split("-");
                library.tag = libTagParts[0] + " " + getReleaseNameFromURL(url) + " -" + libTagParts[1];
            }

            // |-----------------------------------------------------------------|
            // | ADD DATA TO THE DATA.JSON THAT RELIES ON THE REPORT.YAML |
            // |-----------------------------------------------------------------|

            // Load report.yaml as json
            let reportJSON = yaml2json.safeLoad(readFileSync(files.gsReport, "utf8"));

            // Get the key of the library in the report.yaml projects
            let projectKey = getLibraryKey(reportJSON.projects, url);
            // Return if the library does not exist in the report
            if (!reportJSON.projects[projectKey]) {
                return
            }

            // Create a "metadata" section and add selected data to this section
            // Only add the data if it is not yet manually defined
            METADATA.forEach(metadata => {

                let reportTask = reportJSON.projects[projectKey][metadata.task];
                // Return if the task is not defined in the report.yaml
                if (!reportTask) {
                    return
                }

                let reportAttr = reportJSON.projects[projectKey][metadata.task][metadata.gsKey];
                // Return if the metadata is not defined in the report.yaml
                if (!reportAttr) {
                    return
                }

                // Check if the information is already manually defined
                // in the md-file.
                if (!metaDataListContainsItem(library[METADATA_KEY], metadata.metadataKey)) {

                    // Create string that is added to the list of metadata in the form of e.g.
                    // "Stars: 748"
                    let plainItem = metadata.metadataKey + ": " + reportAttr;
                    let dataJSONItem = createChildDataJSON(plainItem);
                    // Add new item to the metadata-list in data.json
                    addToDataJSONMap(library[METADATA_KEY], dataJSONItem);
                    addPlainListToMap(library[METADATA_KEY]);
                }

            });

            // For every attribute, create a separate section in the data.json
            // and add the information from the report.yaml to this section
            ATTRIBUTES.forEach(attribute => {

                let reportTask = reportJSON.projects[projectKey][attribute.task];
                if (library[attribute.mdKey] || !reportTask) {
                    return
                }

                let reportAttr = reportJSON.projects[projectKey][attribute.task][attribute.gsKey];
                if (reportAttr) {
                    addReportAttributeToLibrary(library, attribute, reportAttr)
                }
            });
        }

        addInfoToEmptySections(library);
    });

    // Save data in data.json
    writeFileSync(files.dataJson, JSON.stringify(dataJSON), "utf8");
}

// If there are any sections that have no information, add an info text to them.
// This info text suggests to the user to propose his own information instead
// of leaving an empty field in the details view of a library.
function addInfoToEmptySections(library) {
    // Check if repository field is empty
    if (!libraryHasSection(library, REPO_KEY)) {
        let infoText = "No Repository specified";
        let infoTextMap = createMapDataJSON();
        let infoTextChild = createChildDataJSON(infoText);
        addToDataJSONMap(infoTextMap, infoTextChild);
        library[REPO_KEY] = infoTextMap;
    }

    if (!libraryHasSection(library, "Interface Languages")) {
        let infoText = "No Interface Languages specified";
        let infoTextMap = createMapDataJSON();
        let infoTextChild = createChildDataJSON(infoText);
        addToDataJSONMap(infoTextMap, infoTextChild);
        library["Interface Languages"] = infoTextMap;
    }

    // Check if attribute fields are empty
    ATTRIBUTES.forEach(attribute => {
        if (!libraryHasSection(library, attribute.mdKey)) {
            let infoText = "No Information";
            let infoTextMap = createMapDataJSON();
            let infoTextChild = createChildDataJSON(infoText);
            addToDataJSONMap(infoTextMap, infoTextChild);
            library[attribute.mdKey] = infoTextMap;
        }
    });
}

// Checks if the library has a section with the name that contains information.
// Returns true if the section exists and contains information, otherwise false.
function libraryHasSection(library, sectionName) {
    return library[sectionName] && library[sectionName].childs[0][0];
}

// Checks if the metadata-list of the dataJSON-format contains
// an item which has the same name as the item-param.
// Returns true if defined, otherwise false.
// Type dataJSONList: Array in form of the items in dataJSON.
// Type item: string.
function metaDataListContainsItem(dataJSONList, item) {
    let containsItem = false;
    dataJSONList.childs[0][0].forEach(child => {
        let listItemName = child.content.split(":")[0];
        if (listItemName === item) {
            containsItem = true;
        }
    });
    return containsItem
}

function addReportAttributeToLibrary(library, attribute, reportAttr) {

    let attrMapDataJSON = createMapDataJSON();
    // Add information to the map
    // The type of the information defines
    // which information will be added to the map
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
            console.log("No valid type for attribute " + attribute.gsKey + " found in gitScrabber-report");
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
                console.log("No valid type for attribute " + attribute.gsKey + " found in gitScrabber-report");
        }
        // Add map to data.json
        library[attribute.mdKey] = attrMapDataJSON;
    }
}

// Get the name of the release from the url
function addReleaseTagToMetaDataList(library) {
    let tag = "";

    let url = getUrlOfLibrary(library);

    if (url && isArchive(url)) {            // Archive -> get release name from url
        tag = RELEASE_KEY + ": " + getReleaseNameFromURL(url);
    } else if (url && !isArchive(url)) {    // Repository
        tag = "The information is applicable to the latest commit in the repository, not a specific release!";
    } else {                                // Unknown
        tag = "The release of this entry is unknown";
    }

    let releaseItem = createChildDataJSON(tag);
    addToDataJSONMap(library[METADATA_KEY], releaseItem);
    addPlainListToMap(library[METADATA_KEY]);
}

function getReleaseNameFromURL(url) {
    let tag = "";
    // Remove .zip/.rar from end of url
    let trimmedUrl = url.slice(0, -4);
    // Remove https:// from beginning
    trimmedUrl = trimmedUrl.startsWith("https://") ? trimmedUrl.slice(8) : trimmedUrl;
    // Remove "www." from beginning
    trimmedUrl = trimmedUrl.startsWith("www.") ? trimmedUrl.slice(3) : trimmedUrl;

    let urlParts = trimmedUrl.split("/");

    // Return the correct part of the url that contains the name of the release
    if (trimmedUrl.startsWith("github.com") || trimmedUrl.startsWith("bitbucket.org")) {
        tag = urlParts[urlParts.length - 1];
    } else if (trimmedUrl.startsWith("gitlab.com")) {
        tag = urlParts[urlParts.length - 2];
    }
    // TODO Support other git-hosts
    return tag;
}

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
