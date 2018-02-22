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