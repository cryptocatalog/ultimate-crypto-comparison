import {readFileSync, writeFileSync} from "fs";
import yaml2json from "js-yaml";

export function cveInfo(files, done) {
    // --------------------------------------------------------
    // This task is using the API of www.circl.lu to obtain
    // information about the Common Vulnerabilities and
    // Exposures of each listed library.
    // --------------------------------------------------------

    const vendorKey = "CVE Vendor";
    const productKey = "CVE Product";
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
            vendor = library[vendorKey].childs[0][0];
        }
        return vendor;
    }

    function getProductOfLibrary(library) {
        let product = null;
        if (libraryHasProduct(library)) {   // CVE Product is specified
            product = library[productKey].childs[0][0];
        }
        return product;
    }

    function replaceAll(str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace);
    }

    function getAllSummariesOfApiResponse(apiResponse, vendor, product) {
        let summaryString = "";
        let counter = 0;
        while (apiResponse[counter]) {
            let apiString = apiResponse[counter].summary;
            // Clean the summary from unintentional chars
            apiString = replaceAll(apiString, '\"', '');
            apiString = replaceAll(apiString, '"', '');
            apiString = replaceAll(apiString, '\0', '');
            // Link to cve entry
            let cveLink = "(<https:\//cve.circl.lu\/cve\/" + apiResponse[counter].id + ">)";

            // Check if summary is longer than 26500 chars.
            // If it is longer than 26596 the string
            // cannot be parsed to json.
            if ((summaryString + apiString).length > 26500) {
                summaryString += "\\n - CVE Report ist too long. " +
                    "[Here is a list of all CVE\'s](https://cve.circl.lu/search/" + vendor + "/" + product + ").";
                break
            }

            // Make a list out of the summaries
            summaryString = summaryString === "" ? "- " + apiString + " " + cveLink :
                summaryString + "\\n" + " - " + apiString + " " + cveLink;

            counter++;
        }

        return summaryString;
    }

    function getJsonFromApi(url) {
        const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        let httpReq = new XMLHttpRequest();
        httpReq.open("GET", url, false);
        httpReq.send(null);
        return JSON.parse(httpReq.responseText);
    }


    function getCveDetailsFromApi() {

        dataJSON.forEach(library => {

            let vendor = getVendorOfLibrary(library);
            let product = getProductOfLibrary(library);

            // Ignore the template library and libraries that have no vendor and product defined.
            if (vendor && product) {
                // Built the url for the API request.
                let url = "https://cve.circl.lu/api/search/" + vendor + "/" + product;

                let jsonFromApi = getJsonFromApi(url);

                let cleanSummary = getAllSummariesOfApiResponse(jsonFromApi, vendor, product);

                if (cleanSummary === "") {
                    cleanSummary = "No CVE report found. The specified CVE Vendor/CVE Product may be incorrect.";
                }

                addSummaryToDataJSON(library, cleanSummary);

            } else {
                const NO_CVE_INFO_SPECIFIED = "No CVE Vendor or CVE Product to search for CVE Details specified. " +
                    "You can find the info about this library in " +
                    "[this directory](https://github.com/cryptocatalog/ultimate-crypto-comparison/tree/master/data). " +
                    "You can [create a pull-request](https://github.com/cryptocatalog/ultimate-crypto-comparison/pulls) " +
                    "or open a [new issue](https://github.com/cryptocatalog/ultimate-crypto-comparison/issues) " +
                    "to add this information.";
                addSummaryToDataJSON(library, NO_CVE_INFO_SPECIFIED);
            }
        });

        // Save data in data.json
        writeFileSync(files.dataJson, JSON.stringify(dataJSON), "utf8");

    }

    function addSummaryToDataJSON(library, cleanSummary) {

        // Try to save the summary in the data.json.
        try {
            let summaryMap = createMapDataJSON(cleanSummary);
            let summaryItem = createChildDataJSON(cleanSummary);
            addToDataJSONMap(summaryMap, summaryItem);
            library[dataSummaryKey] = summaryMap;
        } catch (err) {
            console.log("Error while parsing JSON CVE-report: ", cleanSummary);
            console.log(err.message);
        }
    }

}
