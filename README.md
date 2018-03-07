# Ultimate-crypto-comparison - https://cryptocatalog.github.io/ultimate-crypto-comparison/

The ultimate-crypto-comparison is a catalog to compare cryptographic libraries.

**What makes this catalog special?**

This catalog collects additional information about the libraries specified in the data directory. This information includes e.g.:
- Used encryptions (hash functions, stream-/block-ciphers, protocols...)
- State of development
- Security issues of the libraries

## Contributing

Contributing is easy:

1. Open a pull-request
2. Define a library
3. An authorized person will review your proposal

## Defining a library

For each library, create a markdown-file in the `data` -directory. You can base it on template.md. If you do not want to add information to a specific section in the markdown-file, just remove the section. If you want to add additional information, just add a new section with your information

### Releases and repositories
Every markdown-file in the `data`-directory specifies a specific release (or the "latest" version) of a library.

**Releases**  
If you specify a release of a library, add the url to the downloadable archive under the `## Download` section in the markdown-file.

```
    ## Download
    - https://github.com/randombit/botan/archive/2.4.0.zip
```

Additionally, you can add the link to the repository under the `## Repository` section. The automatically gathered data is however applicable to the release.

**"Latest" version**  
If you want to generally add a library without specifying a release, you can just add the link to the repository under the `## Repository`section in the markdown-file.  

```
    ## Repository
    - https://github.com/randombit/botan
```

## Automatically added information
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

## Known Issues
- This catalog is mainly tested with libraries from GitHub. Libraries from other hosters (GitLab, BitBucket...), due different urls, may lead to problems
- Searching for "match all" attributes if one library does not have this attribute specified
- Markdown-files need to have a `Repository` -section. If they don't have one, the build fails.

## Acknowledgements
Thanks to the [Ultimate-Comparison-Framework](https://github.com/ultimate-comparisons/ultimate-comparison-BASE) for providing a great base to work with.

## License

The code is licensed under [MIT], the content (located at `data`) under [CC0-1.0].

  [CC0-1.0]: https://creativecommons.org/publicdomain/zero/1.0/

<hr />

  [MIT]: https://opensource.org/licenses/MIT
  [CC-BY-SA-4.0]: http://creativecommons.org/licenses/by-sa/4.0/
