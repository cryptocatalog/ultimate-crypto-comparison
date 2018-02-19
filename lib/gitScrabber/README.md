# About

This is a framework to gather information from various sources (git, svn and archives).
The name _gitScrabber_ is a phun on datamining and huge frameworks like hadoop for 'big data' as this tool will only scratch the surface (which 'might' be enough).

It's written with speed/parallelism in mind and was able to analyse ~19GB in about two hours.
Repeated executions are sped up by using cached data and may take only a few seconds.
A threadpool is used to analyse the _projects_ specified via the task file in parallel.
Before the tasks are executed the projects are cloned, updated or downloaded from their sources.

Since it is created as a 'framework' it's rather easy to extend; under `gitScrabber/gitScrabber/scrabTasks` three types of tasks may be defined:
* _file_-tasks can operate on the files and their contents them selfs and are executed sequentially by file (projects are analysed in parallel).<br>
  Example: We used a file-task to search for cryptographic keywords.
* _git_-tasks are tasks that want to interact with a repository and are executed sequentially by task (projects are analysed in parallel).
  SVN repositories are converted to git repositories for less redundancy.
  These tasks will not be executed for archive projects.<br>
  Example: We used a git-task to gather the amount of authors and contributors.
* _report_-tasks are tasks that only interact with the data that was gathered by the former two task types.
  They are executed truely sequentially after all other tasks from all projects have finished.<br>
  Example: We used a report-task to generate LaTeX tables of the gathered data.

As this was written without much time there are no tests and some documentation.
It did the job it was written for very well so there are things to be taken away from this project - but probably not everything.

# Usage

```
usage: gitScrabber [-t file] [-r file] [-o file] [-c file] [-d dir] [-p] [-f]
                   [-h] [--github-token str]

ScrabGitRepos

Required arguments:
  -t file, --tasks file
                        Path to the tasks.yaml file - can be provided via
                        configuration file

Program arguments:
  -r file, --report file
                        Path to an old report as base
  -o file, --output file
                        Path where the report will be saved to
  -c file, --config file
                        Path to the configuration file - defaults to
                        './gitScrabber.conf'. Write the command line arguments
                        without leading dashes e.g.:
                        print
                        data=/tmp
  -d dir, --data dir    Directory where the repositories and archives are
                        stored
  -p, --print           If the report should be printed to stdout - defaults
                        to false
  -f, --force           Forces the override of a present report - defaults to
                        false
  -h, --help            Show this help message and exit

Global arguments:
  --github-token str    Access token for github to work with a higher query
                        limit against their api
```

# Dependencies

- If not already installed:
    - `python3-pip`
    - `python3-setuptools`
- `dateutil`
- `numpy`
- `packaging`
- `pyunpack`
- `regex`
- `ruamel.yaml`
- `requests`
- Maybe more

