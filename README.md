# [Ultimate-crypto-comparison](https://cryptocatalog.github.io/ultimate-crypto-comparison/)

The ultimate-crypto-comparison is a catalog to compare cryptographic libraries.

**What makes this catalog special?**

This catalog collects additional information about the libraries specified in the data directory. This information includes e.g.:
- Used encryptions (hash functions, stream-/block-ciphers, protocols...)
- State of development
- CVEs of the libraries

## :heavy_plus_sign: Adding a new library

Adding a new library is easy:

1. Fork this repository
2. Define a library
3. Open a pull-request

or [open a new issue](https://github.com/cryptocatalog/ultimate-crypto-comparison/issues/new) and specify the library to add.  
An authorized person will review your proposal!

## :pencil2: Defining a library

For each library create a markdown-file in the `data` -directory. You can base it on template.md. If you do not want to add information to a specific section in the markdown-file, just remove the section. If you want to add additional information, just add a new section with your information.

### Releases and repositories
Every markdown-file in the `data`-directory specifies a specific release (or the "latest" version) of a library.

**Releases**  
If you specify a release of a library, add the url to the downloadable archive under the `## Archive` section in the markdown-file.

```
    ## Archive
    - https://github.com/randombit/botan/archive/2.4.0.zip
```

Additionally, you can add the link to the repository under the `## Repository` section. The automatically gathered data is however applicable to the release.

**"Latest" version**  
If you want to generally add a library without specifying a release, you can just add the link to the repository under the `## Repository`section in the markdown-file.  

```
    ## Repository
    - https://github.com/randombit/botan
```

## :books: Automatically added information
If applicable information about a library can be found, it will be shown in the catalog.  
If you specify the information in the markdown-file, the manually added data will be preferred.  
The following information will be searched for:
- Release
- Development Language
- Stars
- Block Ciphers
- Stream Ciphers
- Hash Functions
- Encryption Modes
- Message Authentication Codes
- Public Key Cryptography
- Public Key Infrastructure
- Protocols

## :fire: Automatically added CVE information
If the library contains a CVE Vendor and a CVE product the catalog automatically adds information about Common Vulnerabilities and Exposures. If no CVE vendor and CVE product ist specified in the markdown-file, you can [search for the respective product- and vendor-name](https://cve.circl.lu/browse) and add it to the markdown-file of the library. The catalog uses the API of https://www.circl.lu/services/cve-search/.  
If you want to try whether you have the correct vendor and product name you can use the API in the browser to test it.  
Just put in your found vendor and product in the following link: http://cve.circl.lu/api/search/"YourVendor"/"YourProduct"
If you get a response with some text in JSON, it works!


## :warning: Known Issues
- Markdown-files need to have a `Repository` -section. If they don't have one, the build fails.

## :crown: Acknowledgements
- Thanks to the [Ultimate-Comparison-Framework](https://github.com/ultimate-comparisons/ultimate-comparison-BASE) for providing a great base to work with.  
- Thanks to the [gitScrabber](https://github.com/Eyenseo/gitScrabber) for collecting additional information about the libraries.

## License

The code is licensed under [MIT], the content (located at `data`) under [CC0-1.0].

  [CC0-1.0]: https://creativecommons.org/publicdomain/zero/1.0/

<hr />

  [MIT]: https://opensource.org/licenses/MIT
  [CC-BY-SA-4.0]: http://creativecommons.org/licenses/by-sa/4.0/
