"""
The MIT License (MIT)

Copyright (c) 2017 Roland Jaeger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""


from taskExecutionManager import TaskExecutionManager
from scrabTaskManager import ScrabTaskManager
import argHandler

import ruamel.yaml


class GlobalArgs():
    """
    Helper class that holds the global arguments.
    """

    def __init__(self, github_token):
        self.github_token = github_token


class GitScrabber:
    """
    A script to scrab information from git repos

    :param  task_file:    yaml file path that holds the task details
    :param  report_file:  yaml file path that holds the results from a previous
                          execution
    :param  output_file:  file path where the results of the execution will be
                          saved
    :param  data_dir:     directory path where the repositories will be cloned
                          to
    :param  printing      If the report should be printed to stdout
    :param  global_args:  Arguments that will be passed to all tasks. They
                          _might_ contain something that is useful for the task,
                          but the task has to check if it is _there_ as these
                          are user provided. If they are needed to work that
                          check should happen in the argHandler.
    """

    def __init__(self,
                 task_file,
                 report_file=None,
                 output_file=None,
                 data_dir=".",
                 printing=False,
                 update=False,
                 global_args={}):
        self.__scrabTaskManager = ScrabTaskManager()
        self.__output_file = output_file
        self.__data_dir = data_dir
        self.__print = printing
        self.__update = update
        self.__global_args = global_args
        self.__tasks = ruamel.yaml.load(
            open(task_file, 'r').read(), Loader=ruamel.yaml.SafeLoader)

        if(report_file):
            self.__old_report = ruamel.yaml.load(
                open(report_file, 'r').read(),
                ruamel.yaml.RoundTripLoader)
        else:
            self.__old_report = None

    def __handele_results(self, report):
        """
        Writes the results of the scrab tasks to file and or to stdout

        :param  report:  report to write
        """
        ruamel.yaml.scalarstring.walk_tree(report)
        if self.__output_file:
            with open(self.__output_file, 'w') as outfile:
                ruamel.yaml.dump(
                    report, outfile, Dumper=ruamel.yaml.RoundTripDumper)

        if self.__print:
            print(ruamel.yaml.dump(report, Dumper=ruamel.yaml.RoundTripDumper))

    def scrab(self):
        """
        Main Function - starts the execution of the scrab tasks

        :returns: the report as python object
        """
        executionManager = TaskExecutionManager(
            cache_dir=self.__data_dir,
            project_tasks=self.__tasks['project_tasks'],
            report_tasks=self.__tasks['report_tasks'],
            projects=self.__tasks['projects'],
            old_report=self.__old_report,
            update=self.__update,
            global_args=self.__global_args,
            scrabTaskManager=self.__scrabTaskManager)
        report = executionManager.create_report()

        self.__handele_results(report)

        return report


def main(args=None):
    """
    Module main function

    :param    args:  Commandline arguments that will be parsed

    :returns: The results of the scrab method
    """
    args = argHandler.parse_args(args)
    return GitScrabber(
        task_file=args.tasks,
        report_file=args.report,
        output_file=args.output,
        data_dir=args.data,
        printing=args.print,
        update=args.update,
        global_args=GlobalArgs(args.github_token)
    ).scrab()


if __name__ == "__main__":
    main()
