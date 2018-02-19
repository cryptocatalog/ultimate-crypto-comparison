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


from ..scrabTask import ReportTask

from scrabTasks.report.generateLaTeXOverviewTable import has_interface_language
from utils import containedStructure, tex_escape

from datetime import datetime, timezone
from dateutil import parser

import numpy

name = "GenerateLaTeXStatisticsTable"
version = "1.0.0"


def get_impacts(reports):
    """
    Obtains a list containing all impacts from the given reports

    :param    reports:  The reports to obtain the impacts from

    :returns: The impacts as a list
    """
    required = {"impact": 0.0}
    impacts = []
    for report in reports:
        if not containedStructure(required, report):
            continue
        impacts.append(report['impact'])
    return impacts


def get_authors(reports):
    """
    Obtains a list containing all author amounts from the given reports

    :param    reports:  The reports to obtain the authors from

    :returns: A list of the amounts of authors
    """
    required = {"AuthorContributorCounter": {"author#": 0}}
    authors = []
    for report in reports:
        if not containedStructure(required, report):
            continue
        authors.append(report["AuthorContributorCounter"]["author#"])
    return authors


def get_contributors(reports):
    """
    Obtains a list containing all contributor amounts from the given reports

    :param    reports:  The reports to obtain the contributors from

    :returns: A list of the amounts of contributors
    """
    required = {"AuthorContributorCounter": {"contributor#": 0}}
    contributor = []
    for report in reports:
        if not containedStructure(required, report):
            continue
        contributor.append(report["AuthorContributorCounter"]["contributor#"])
    return contributor


def get_locs(reports):
    """
    Obtains a list containing all lines of code from the given reports

    :param    reports:  The reports to obtain the lines of code from

    :returns: The lines of code as a list
    """
    required = {"ProjectMetrics": {"loc": {"source": 0}}}
    locs = []
    for report in reports:
        if not containedStructure(required, report):
            continue
        locs.append(report["ProjectMetrics"]["loc"]["source"])
    return locs


def get_ages(reports):
    """
    Obtains a list containing all age in days from the given reports

    :param    reports:  The reports to obtain the age in days from

    :returns: The age in days as a list
    """
    required = {"ProjectDates": {"first_change": ""}}
    ages = []
    for report in reports:
        if not containedStructure(required, report):
            continue
        duaration = (datetime.now(timezone.utc)
                     - parser.parse(report["ProjectDates"]["first_change"]))
        ages.append(duaration.days)
    return ages


def get_change_ages(reports):
    """
    Obtains a list containing all the durations since the last update from the
    given reports

    :param    reports:  The reports to obtain the the durations since the last
                        update from

    :returns: The the durations since the last update as a list
    """
    required = {"ProjectDates": {"last_change": ""}}
    ages = []
    for report in reports:
        if not containedStructure(required, report):
            continue
        duaration = (datetime.now(timezone.utc)
                     - parser.parse(report["ProjectDates"]["last_change"]))
        ages.append(duaration.days)
    return ages


class Statistics():

    """
    Convenience class to hold the statistical information

    :param    data:  The data to get the statistical information from
    """

    def __init__(self, data):
        self.min = numpy.min(data)
        self.max = numpy.max(data)
        self.median = numpy.median(data)
        self.mean = numpy.mean(data)
        self.quatal_1 = numpy.percentile(data, 25)
        self.quatal_3 = numpy.percentile(data, 75)


class LanuageStatistics():

    """
    Convenience class that holds statistical information for one language

    :param    project_reports:  The project reports to get the information from
    """

    def __init__(self, project_reports):
        self.impact = Statistics(get_impacts(project_reports))
        self.age = Statistics(get_ages(project_reports))
        self.change = Statistics(get_change_ages(project_reports))
        self.author = Statistics(get_authors(project_reports))
        self.contributor = Statistics(get_contributors(project_reports))
        self.loc = Statistics(get_locs(project_reports))


class GenerateLaTeXStatisticsTable(ReportTask):

    """
    Generates TeX tables for the different languages and a total table that
    display the statistical information about the differed projects.

    Example:
      GenerateLaTeXStatisticsTable:
        Total: |-
          {
            \centering
            \tabulinesep=4pt
            \setlength{\tabcolsep}{.3em}
            \tabulinesep=.3em
            \begin{longtabu}{lX[r]X[r]X[r]X[r]X[r]X[r]}
              \taburowcolors2{white!95!LightGray..white!80!LightGray}
              \rowfont[c]{}
              {}
                & Min
                  & 1st Qu.
                    & Median
                        & Mean
                            & 3rd Qu.
                              & Max\\
              Impact
                & 11.21
                  & 13.60
                    & 16.36
                        & 18.50
                            & 21.61
                              & 40.00\\
              Age in days
                & 44.00
                  & 391.50
                    & 701.00
                        & 926.84
                            & 1084.25
                              & 7230.00\\
              Days since updated
                & 1.00
                  & 79.00
                    & 224.00
                        & 350.24
                            & 527.50
                              & 3207.00\\
              Authors
                & 1.00
                  & 1.00
                    & 1.00
                        & 1.23
                            & 1.00
                              & 19.00\\
              Contributors
                & 0.00
                  & 0.00
                    & 1.00
                        & 8.33
                            & 3.00
                              & 779.00\\
              LOC
                & 0.00k
                  & 0.54k
                    & 1.64k
                        & 28k
                            & 7.83k
                              & 3978k\\
            \taburowcolors1{white..white}
            \caption{Total statistics}
            \label{tab:total-statistics}\\
            \end{longtabu}
          }

    :param  parameter:    Parameter given explicitly for this task, for all
                          projects, defined in the task.yaml
    :param  global_args:  Arguments that will be passed to all tasks. They
                          _might_ contain something that is useful for the task,
                          but the task has to check if it is _there_ as these
                          are user provided. If they are needed to work that
                          check should happen in the argHandler.
    """

    def __init__(self, parameter, global_args):
        super(GenerateLaTeXStatisticsTable, self).__init__(name, version,
                                                           parameter,
                                                           global_args)
        self.__languages = [
            'C++',
            'C',
            'Rust',
            'Ruby',
            'Java',
            'Go',
            'PHP',
            'JavaScript',
            'Objective-C',
            'Swift',
            'C#',
            'Python'
        ]

    def __row(self, kind, stat, func=None):
        """
        Generates one TeX row with the provided data

        :param    kind:  The kind of row
        :param    stat:  The statistical information that will be displayed
        :param    func:  The function to apply to each statistical data point

        :returns: TeX string that contains one row with the provided data
        """
        if not func:
            def f(i):
                return "{0:.2f}".format(i)
            func = f
        return r"""
    {kind}
      & {min}
        & {q1}
          & {med}
              & {mean}
                  & {q3}
                    & {max}\\""".format(
            kind=kind,
            min=func(stat.min),
            q1=func(stat.quatal_1),
            med=func(stat.median),
            mean=func(stat.mean),
            q3=func(stat.quatal_3),
            max=func(stat.max)
        )

    def __header(self):
        """
        Generates the header for a TeX table

        :returns: The header of the TeX table
        """
        return r"""{
  \centering
  \tabulinesep=4pt
  \setlength{\tabcolsep}{.3em}
  \tabulinesep=.3em
  \begin{longtabu}{lX[r]X[r]X[r]X[r]X[r]X[r]}
    \taburowcolors2{white!95!LightGray..white!80!LightGray}
    \rowfont[c]{}
    {}
      & Min
        & 1st Qu.
          & Median
              & Mean
                  & 3rd Qu.
                    & Max\\"""

    def __impact_row(self, stat):
        """
        Generates the impact row

        :param    stat:  The statistical information to display

        :returns: TeX string that contains the impact row
        """
        return self.__row("Impact", stat.impact)

    def __age_row(self, stat):
        """
        Generates the age row

        :param    stat:  The statistical information to display

        :returns: TeX string that contains the age row
        """
        return self.__row("Age in days", stat.age)

    def __change_row(self, stat):
        """
        Generates the change row

        :param    stat:  The statistical information to display

        :returns: TeX string that contains the change row
        """
        return self.__row("Days since updated", stat.change)

    def __author_row(self, stat):
        """
        Generates the authors row

        :param    stat:  The statistical information to display

        :returns: TeX string that contains the authors row
        """
        return self.__row("Authors", stat.author)

    def __contributor_row(self, stat):
        """
        Generates the contributor row

        :param    stat:  The statistical information to display

        :returns: TeX string that contains the contributor row
        """
        return self.__row("Contributors", stat.contributor)

    def __loc_row(self, stat):
        """
        Generates the loc row

        :param    stat:  The statistical information to display

        :returns: TeX string that contains the loc row
        """
        def f(i):
            if i / 1000 > 10:
                return str(int(i / 1000)) + "k"
            else:
                return "{0:.2f}".format(i / 1000) + 'k'
        return self.__row("LOC", stat.loc, f)

    def __tail(self, lang):
        """
        generates the tail of the TeX table

        :param    lang:  The language the table is generated for

        :returns: TeX string that contains the tail of the table
        """
        label = lang.lower().replace("#", "s").replace("+", "p")
        return r"""
  \taburowcolors1{white..white}
  \caption{%s statistics}
  \label{tab:%s-statistics}\\
  \end{longtabu}
}""" % (tex_escape(lang), tex_escape(label))

    def __statistic_tables(self, stats):
        """
        Generates the statistical tables from the provided data

        :param    stats:  The statistical information to display in the tables

        :returns: A dict that contains the different tables
        """
        tables = {}
        for lang, stat in stats.items():
            table = self.__header()
            table += self.__impact_row(stat)
            table += self.__age_row(stat)
            table += self.__change_row(stat)
            table += self.__author_row(stat)
            table += self.__contributor_row(stat)
            table += self.__loc_row(stat)
            table += self.__tail(lang)
            tables[lang] = table
        return tables

    def __preamble(self):
        """
        Generates the preamble needed to compile the tables

        :returns: The preamble needed to compile the tables
        """
        return r"""\usepackage[svgnames,table]{xcolor}
\usepackage{longtable}
\usepackage{tabu}"""

    def scrab(self, report):
        """
        Generates TeX tables for the different languages and a total table that
        display the statistical information about the differed projects.

        :param    report:  The report to analyse _and_ change

        :returns: Report that contains all scrabbed information and the overview
                  tables
                  Example:
                    GenerateLaTeXStatisticsTable:
                      Total: |-
                        {
                          \centering
                          \tabulinesep=4pt
                          \setlength{\tabcolsep}{.3em}
                          \tabulinesep=.3em
                          \begin{longtabu}{lX[r]X[r]X[r]X[r]X[r]X[r]}
                            \taburowcolors2{white!95!LightGray..white!80!LightGray}
                            \rowfont[c]{}
                            {}
                              & Min
                                & 1st Qu.
                                  & Median
                                      & Mean
                                          & 3rd Qu.
                                            & Max\\
                            Impact
                              & 11.21
                                & 13.60
                                  & 16.36
                                      & 18.50
                                          & 21.61
                                            & 40.00\\
                            Age in days
                              & 44.00
                                & 391.50
                                  & 701.00
                                      & 926.84
                                          & 1084.25
                                            & 7230.00\\
                            Days since updated
                              & 1.00
                                & 79.00
                                  & 224.00
                                      & 350.24
                                          & 527.50
                                            & 3207.00\\
                            Authors
                              & 1.00
                                & 1.00
                                  & 1.00
                                      & 1.23
                                          & 1.00
                                            & 19.00\\
                            Contributors
                              & 0.00
                                & 0.00
                                  & 1.00
                                      & 8.33
                                          & 3.00
                                            & 779.00\\
                            LOC
                              & 0.00k
                                & 0.54k
                                  & 1.64k
                                      & 28k
                                          & 7.83k
                                            & 3978k\\
                          \taburowcolors1{white..white}
                          \caption{Total statistics}
                          \label{tab:total-statistics}\\
                          \end{longtabu}
                        }
        """
        reports = report['projects'].values()
        stats = {'Total': LanuageStatistics(reports)}

        for lang in self.__languages:
            stats[lang] = LanuageStatistics(
                [r for r in reports if has_interface_language(r, lang)]
            )

        report['GenerateLaTeXStatisticsTable'] = self.__statistic_tables(stats)
        report['GenerateLaTeXStatisticsTable']['preamble'] = self.__preamble()
        return report
