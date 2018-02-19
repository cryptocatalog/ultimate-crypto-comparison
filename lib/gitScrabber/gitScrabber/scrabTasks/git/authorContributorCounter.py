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


from ..scrabTask import GitTask

import utils
import re

name = "AuthorContributorCounter"
version = "1.1.0"


class AuthorContributorCounter(GitTask):
    """
    Counts the authors and contributors of a repo

    Example:
        AuthorContributorCounter:
          author#: 4
          contributor#: 369

    :param  parameter:    Parameter given explicitly for this task, for all
                          projects, defined in the task.yaml
    :param  global_args:  Arguments that will be passed to all tasks. They
                          _might_ contain something that is useful for the task,
                          but the task has to check if it is _there_ as these
                          are user provided. If they are needed to work that
                          check should happen in the argHandler.
    """

    def __init__(self, parameter, global_args):
        super(AuthorContributorCounter, self).__init__(name, version,
                                                       parameter, global_args)
        self.__project = None
        self.__mapped_shortlog = None

    def __create_shortlog(self):
        """
        Creates a dict that represents the shortlog that git outputs

        :returns: The shortlog dict
        """
        shortlog = utils.run(
            'git', ['shortlog', '-s', '-n', '--no-merges'],
            self.__project.location)
        mapped_log = []

        for line in shortlog.split('\n'):
            if line:
                match = re.search('\s*(\d*)\s*(.*)', line)
                #                  (number of commits, author name)
                mapped_log.append((int(match.group(1)), match.group(2)))
        return mapped_log

    def __calc_cutof(self):
        """
        Calculates where the hard cut of for authors should be.

        This is needed for linear decreasing commit graphs per author, where the
        difference between the amount of commits between the authors is too
        small to result in a rejection

        :returns: Hard cut of value for the author contributor classification.
        """
        top_cont, _ = self.__mapped_shortlog[0]
        mean_cut = top_cont * 0.05

        summ = 0
        numm = 0
        for count, _ in self.__mapped_shortlog:
            if count >= mean_cut:
                summ += count
                numm += 1
            else:
                break
        return summ / numm

    def __calc_contributor_authors(self):
        """
        Calculates who is considered a contributor or an author.

        The calculation is done by the difference in commits between authors and
        a hard cut of.

        :returns: The contributor authors as a dict.
        """
        authors = []
        contributors = []

        cutof = self.__calc_cutof()
        prev_count, _ = self.__mapped_shortlog[0]

        for count, cont in self.__mapped_shortlog:
            if count >= cutof and count >= prev_count*0.4:
                prev_count = count
                authors.append((count, cont))
            else:
                contributors.append((count, cont))

        return {'authors': authors, 'contributors': contributors, }

    def scrab(self, project):
        """
        Counts the authors and contributors of a repo

        :param    project:         The project

        :returns: The report of this task as a dictionary
                  Example:
                      AuthorContributorCounter:
                        author#: 4
                        contributor#: 369
        """
        self.__project = project
        self.__mapped_shortlog = self.__create_shortlog()
        classified = self.__calc_contributor_authors()

        report = {}
        report['author#'] = len(classified['authors'])
        # report['authors'] = classified['authors']

        report['contributor#'] = len(classified['contributors'])
        # report['contributors'] = classified['contributors']

        return report
