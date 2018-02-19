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


class ScrabTask():

    """
    Base class of all scrab tasks

    __DO NOT__ inherit! Use a dedicated class like GitTask!

    :param    name:         The name of the scrab task
    :param    kind:         The kind of the scrab task
    :param    version:      The version of the scrab task
    :param    parameter:    The parameter for the scrab task
    :param    global_args:  The global arguments global arguments that may
                            be interesting for the scrab task
    """

    def __init__(self, name, kind, version, parameter, global_args):
        self.name = name
        self.kind = kind
        self.version = version
        self._parameter = parameter
        self._global_args = global_args


class GitTask(ScrabTask):

    """
    Base class of all scrab tasks that want to analyse a git project.
    It is important to note, that this task is intended to collect git data only
    if you wish to collect data about files or even search in them use the
    FileTask class as base class

    :param    name:         The name of the scrab task
    :param    version:      The version of the scrab task
    :param    parameter:    The parameter for the scrab task
    :param    global_args:  The global arguments global arguments that may be
                            interesting for the scrab task
    """

    def __init__(self, name, version, parameter, global_args):
        super(GitTask, self).__init__(name, 'git', version, parameter,
                                      global_args)

    def scrab(self, project):
        """
        Function that will be called to analyse the given project

        __Override this method and do not call it!__

        :param    project:  The project that the scrab task shall analyse

        :returns: Report that contains all scrabbed information
        """
        assert False, "You have to implement this function"


class FileTask(ScrabTask):

    """
    Base class of all scrab tasks that want to analyse a the files of a project.
    This task will be provided with the file to analyse which will happen in
    parallel to the other file tasks that are analysing the project (single
    threaded). Thus there are two methods - one to crab the data and one to
    obtain the final report.

    :param    name:         The name of the scrab task
    :param    version:      The version of the scrab task
    :param    parameter:    The parameter for the scrab task
    :param    global_args:  The global arguments global arguments that may be
                            interesting for the scrab task
    """

    def __init__(self, name, version,  parameter, global_args):
        super(FileTask, self).__init__(name, 'git', version, parameter,
                                       global_args)

    def scrab(self, project, filepath, file):
        """
        Function that will be called to analyse the given project file.

        __Override this method and do not call it!__

        :param    project:   The project that the scrab task shall analyse
        :param    filepath:  The filepath to the file that can be analysed
        :param    file:      The file as string that can be analysed
        """
        assert False, "You have to implement this function"

    def report(self):
        """
        Last finishing touches may be done here.

        :returns: Report that contains all scrabbed information
        """
        assert False, "You have to implement this function"


class ReportTask(ScrabTask):

    """
    Base class of all scrab tasks that want to analyse the final report.

    :param    name:         The name of the scrab task
    :param    version:      The version of the scrab task
    :param    parameter:    The parameter for the scrab task
    :param    global_args:  The global arguments global arguments that may be
                            interesting for the scrab task
    """

    def __init__(self, name, version,  parameter, global_args):
        super(ReportTask, self).__init__(name, 'git', version, parameter,
                                         global_args)

    def scrab(self, report):
        """
        Function that will be called to analyse the complete report

        __Override this method and do not call it!__

        :param    report:  The report that the scrab task shall analyse

        :returns: Report that contains all scrabbed information
        """
        assert False, "You have to implement this function"
