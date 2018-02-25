# Ultimate-crypto-comparison
## https://cryptocatalog.github.io/ultimate-crypto-comparison/

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

For each library, create a markdown-file in the data directory. You can base it on template.md. If you do not want to add information to a specific section in the markdown-file, just remove the section. If you want to add additional information, just add a new section with your information

**Url**

In order to automatically retrieve additional information, you have to specify a valid url under the `## Repository` section in the markdown-file. 

The url can be:
- A link to a repository (e.g. https://github.com/randombit/botan)

```
    ## Repository
    - https://github.com/randombit/botan
```

- A link to a downloadable archive (e.g. https://github.com/randombit/botan/archive/2.4.0.zip)

```
    ## Repository
    - https://github.com/randombit/botan/archive/2.4.0.zip
```

**Release Tag**

If you provide the name of the release of a library, this name will be shown in the catalog. If you do not provide a release name, it will either be "Latest" for libraries with a link to a repository or "Unknown" for libraries without a url or  with a link to an archive.

## License

The code is licensed under [MIT], the content (located at `data`) under [CC0-1.0].

  [CC0-1.0]: https://creativecommons.org/publicdomain/zero/1.0/

<hr />

  [MIT]: https://opensource.org/licenses/MIT
  [CC-BY-SA-4.0]: http://creativecommons.org/licenses/by-sa/4.0/
