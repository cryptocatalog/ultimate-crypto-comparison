# README for administrators of the catalog
This document describes the tasks and important information for the administrators of the catalog.

## Process

### Proposing libraries
Libraries are proposed via pull requests, i.e. a contributor adds or edits a markdown-file in the /data directory and opens a pull request. As an administrator, your task is to review this proposal and look if the following standards were adhered to.

### Reviewing proposed libraries

The structure of the template.md must be inherited for the files to be parsed correctly.

The catalog automatically collects data with the [git-scrabber](lib/gitScrabber/README.md). The git-scrabber needs a valid url to a repository or archive to collect additional information. The url must be set under "Repository" in the markdown-file.  
See the [README of the git-scrabber](lib/gitScrabber/README.md) for more information about the git-scrabber. If no url is specified, the git-scrabber will ignore this library.

### Initiating automatic update manually

TODO

### Configuration

The configuration files are located in the **configuration** directory.

**description.md**: It contains the description of your comparison which can be seen by visitors.
It is located underneath the headline of your comparison.
![Description location on page](https://cdn.rawgit.com/ultimate-comparisons/ultimate-comparison-BASE/85cc1e93/docs/images/descritpion.png)

**comparison-example.yml**: Example configuration file containing comments on fields to explain their meaning.

**comparison-default.yml**: Default configuration, intended as backup of your local comparison.

**comparison.yml**: The used configuration. Missing values are taken from **comparison-default.yml** and written back into this file.
A **comparison.yml** has following attributes:

- *title*: The title of the comparison. It is the headline of the page.
  ![Title location on page](https://cdn.rawgit.com/ultimate-comparisons/ultimate-comparison-BASE/85cc1e93/docs/images/title.png)
- *subtitle*: The subtitle of the comparison. It is next to the headline of the page.
  ![Subtitle location on page](https://cdn.rawgit.com/ultimate-comparisons/ultimate-comparison-BASE/85cc1e93/docs/images/subtitle.png)
- *selectTitle*: It is the headline for the search criteria, meaning that the area meant to enter search parameters uses this as headline.
- *tableTitle*: It is the headline for the table, meaning that the area containing the table uses this as headline.
  ![Title of the table on page](https://cdn.rawgit.com/ultimate-comparisons/ultimate-comparison-BASE/85cc1e93/docs/images/tabletitle.png)
- *repository*: The link to the repository containing the comparison.
- *header*: The heading of the details page
    - *nameRef*: Heading of details page (field name) (1)
    - *labelRef*: Which label to add to the heading of the details page (field name) (2)
    - *urlRef*: Which url to show next to the heading of the details page (field name) (3)
  ![Details header construction](https://cdn.rawgit.com/ultimate-comparisons/ultimate-comparison-BASE/85cc1e93/docs/images/detailsheader.png)
- *body*: The body of the details page
    - *title*: The heading of the used field (1)
    - *bodyRef*: The field to use as content of the body (2)
  ![Details body construction](https://cdn.rawgit.com/ultimate-comparisons/ultimate-comparison-BASE/85cc1e93/docs/images/detailsbody.png)
- *citation*: Configures the citation of sources
    - *csl*: The style of the citation as [bibtex](http://www.bibtex.org/) class. Example classes: https://github.com/citation-style-language/styles
    - *bib*: The file containing the used sources in [bibtex](http://www.bibtex.org/) style
- *criteria*: List of fields that all comparison-elements use. The attributes for each criteria are:
    - *name*: The display name of the criteria. Type: `string` (1)
    - *search*: Whether a text box should be added to the search form. Allowed values: `true` (1), `false`
    - *table*: Whether it should be included in the comparison table by default. Allowed values: `true` (2), `false`
    - *detail*: Whether it is in the detail page. Allowed values: `true`, `false`
    - *type*: The content type of the field. Allowed values: `url`, `markdown`, `text`, `label`, `rating`, `repository`
    - *andSearch*: Whether the search should be **match all** (`true`) or **match one** (`false`). Allowed values: `true` (3), `false` (3)
    - *values*: All allowed values the field can assume. Values can have the following attributes:
        - *description*: Part of the tooltip for every instance of the value. Type: `string`
        - *class*: CSS-class of the label. Type: `string` (label-only)
        - *backgroundColor*: The background color of the label. Applies only if no class is given. Type: `string` (label-only)
        - *color*: The text color of the label. Applies only if no class is given. Type: `string` (label-only)
        - *minAge*: The minimum age of the last commit to apply this value. Type: `number` (repository-only)
        - *minAgeUnit*: The unit to apply to the minAge attribute. Allowed values: https://momentjs.com/docs/#/durations/as-iso-string/ (repository-only)
        - *maxAge*: The maximum age of the last commit to apply this value. Type: `number` (repository-only)
        - *maxAgeUnit*: The unit to apply to the maxAge attribute. Allowed values: https://momentjs.com/docs/#/durations/as-iso-string/ (repository-only)
    - *placeholder*: Text shown in the search bar if it is empty (4)
    - *rangeSearch*: Changes search to allow searching for number ranges. It allows searching for numbers and ranges of numbers. Only supports integers. (5)
    ![Various elements of criteria on the page](https://cdn.rawgit.com/ultimate-comparisons/ultimate-comparison-BASE/85cc1e93/docs/images/variouselements.png)
