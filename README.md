# Ultimate Comparison BASE

[![Build Status](https://travis-ci.org/ultimate-comparisons/ultimate-comparison-BASE.svg?branch=master)](https://travis-ci.org/ultimate-comparisons/ultimate-comparison-BASE)
[![Issue Count](https://codeclimate.com/github/ultimate-comparisons/ultimate-comparison-BASE/badges/issue_count.svg)](https://codeclimate.com/github/ultimate-comparisons/ultimate-comparison-BASE)

This is an ultimate comparison framework written in [Angular](https://angular.io/).
It is released on [npm](https://www.npmjs.com/package/ultimate-comparison) under **ultiamte-comparison**.

## Create your own ultimate comparison 
1. Install the **ultimate-comparison**-package globally on your system via `npm install --global ultiamte-comparison`
2. Create the directory which should contain the comparison and change into it, e. g. with `mkdir MY_COMPARISON && cd MY_COMPARISON`
3. Set up your comparison with `uc setup`
    1. Enter the name of your comparison press enter
    2. Enter the [semantic version](https://semver.org/) of your comparison and press enter
    3. Enter a short description of your comparison and press enter (not required)
4. Make sure a `node_modules` directory exists in your current one.
    - If it doesn't exist look at the error message and run `npm install` afterwards
    - The error is most likely a malformed name or version of your comparison
5. Run `uc start` to start the comparison.

### Configuration

The configuration files are located in the **configuration** directory.

**description.md**: It contains the description of your comparison which can be seen by visitors.
It is located underneath the headline of your comparison.

**comparison-example.yml**: Example configuration file containing comments on fields to explain their meaning.

**comparison-default.yml**: Default configuration, intended as backup of your local comparison.

**comparison.yml**: The used configuration. Missing values are taken from **comparison-default.yml** and written back into this file.
A **comparison.yml** has following attributes:

- *title*: The title of the comparison. It is the headline of the page.
- *subtitle*: The subtitle of the comparison. It is next to the headline of the page.
- *selectTitle*: It is the headline for the search criteria, meaning that the area meant to enter search parameters uses this as headline.
- *tableTitle*: It is the headline for the table, meaning that the area containing the table uses this as headline.
- *repository*: The link to the repository containing the comparison.
- TODO

### Define comparison elements

For each thing, create a markdown file in comparison-elements.
You can base it on template.md.
If one column depends on a repository (repo-attribute in **comparison.yml** true), you have to define a `repo` section (## section title) and add the repository as first list item, eg:

    ## Repo
    - https://github.com/ultimate-comparisons/ultimate-comparison-BASE

## Update your comparison

To update the ultimate comparison framework that your comparison uses, just run `npm update` in the directory that contains your comparison.
It installs the latest version with the same major version number (ie. `2.x.x`).
 
## License

The code is licensed under [MIT], the content (located at `comparison-elements`) under [CC0-1.0].

  [CC0-1.0]: https://creativecommons.org/publicdomain/zero/1.0/

<hr />

See [README-THING.template](https://github.com/ultimate-comparisons/ultimate-comparison-BASE/blob/master/README-THING.template.md) for a README skeletton for your ultimate-THING-comparison.

  [MIT]: https://opensource.org/licenses/MIT
  [CC-BY-SA-4.0]: http://creativecommons.org/licenses/by-sa/4.0/
