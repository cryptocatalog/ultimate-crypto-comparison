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

from utils import containedStructure

from numpy import percentile

import copy

name = "ProjectSizeCalculator"
version = "1.0.0"


class MissingManualData(Exception):
    """
    Helper class to filter specific exceptions
    """
    pass


class Limit():

    """
    Convenience class to hold the upper and lower limits of the project sizes

    :param    lower:  The lower
    :param    upper:  The upper
    """

    def __init__(self, lower, upper):
        self.lower = lower
        self.upper = upper


class ProjectSizeCalculator(ReportTask):

    """
    This task analyses the LOC of the different projects by main language and
    interface language. If the project is under the 25% percentile it is
    considered 'small' if it is over the 75% percentile it is considered 'big'

    Example:
      ProjectSizeCalculator:
        C: big
        total: normal

    :param  parameter:    Parameter given explicitly for this task, for all
                          projects, defined in the task.yaml
    :param  global_args:  Arguments that will be passed to all tasks. They
                          _might_ contain something that is useful for the task,
                          but the task has to check if it is _there_ as these
                          are user provided. If they are needed to work that
                          check should happen in the argHandler.
    """

    def __init__(self, parameter, global_args):
        super(ProjectSizeCalculator, self).__init__(name, version, parameter,
                                                    global_args)
        self.__limits = {
            'C++': None,
            'C': None,
            'Rust': None,
            'Ruby': None,
            'Java': None,
            'Go': None,
            'PHP': None,
            'JavaScript': None,
            'Objective-C': None,
            'Swift': None,
            'C#': None,
            'Python': None,
            'total': None
        }

    def __inter_langs(self, project_name, report):
        """
        Obtains the interface languages and throws it they do not exist

        :param    project_name:  The project name that the report belongs to
        :param    report:        The report of the project

        :returns: The interface languages as a list of the project
        """
        if containedStructure({'generalData': {'interfaceLanguage': []}},
                              report):
            inter_lang = report['generalData']['interfaceLanguage']

            if len(inter_lang) > 0:
                return copy.deepcopy(inter_lang)

        if 'url' in report:
            raise MissingManualData(
                "The project '{}' with url '{}' is missing the "
                "'manual.generalData.interfaceLanguage' list."
                "".format(project_name, report['url']))
        else:
            raise MissingManualData(
                "The project '{}' is missing the "
                "'manual.generalData.interfaceLanguage' list."
                "".format(project_name))

    def __loc(self, project, report):
        """
        Obtains the LOC and throws it they do not exist

        :param    project_name:  The project name that the report belongs to
        :param    report:        The report of the project

        :returns: The LOC as a number
        """
        if containedStructure({'ProjectMetrics': {'loc': {'cleaned': 0}}},
                              report):
            return report['ProjectMetrics']['loc']['cleaned']

        if 'url' in report:
            raise MissingManualData(
                "The project '{}' with url '{}' is missing the "
                "'ProjectMetrics.loc.cleaned' number."
                "".format(project, report['url']))
        else:
            raise MissingManualData(
                "The project '{}' is missing the 'ProjectMetrics.loc.cleaned' "
                "number."
                "".format(project))

    def __gather_loc_per_lang(self, projects):
        """
        Gathers the LOC of the different projects per language and as total -
        thus the LOC are counted not uniquely

        :param    projects:  The projects that being analysed

        :returns: A dictionary of languages (and 'total') with a list of numbers
                  as values where the numbers are the LOC of the different
                  projects.
        """
        total_loc = {
            'C++': [],
            'C': [],
            'Rust': [],
            'Ruby': [],
            'Java': [],
            'Go': [],
            'PHP': [],
            'JavaScript': [],
            'Objective-C': [],
            'Swift': [],
            'C#': [],
            'Python': [],
            'total': []
        }
        for project in projects:
            try:
                inter_langs = self.__inter_langs(project, projects[project])
                loc = self.__loc(project, projects[project])

                for lang in inter_langs:
                    if lang in total_loc:
                        total_loc[lang].append(loc)
                total_loc['total'].append(loc)
            except MissingManualData as e:
                pass  # we can't do nothing about it
        return total_loc

    def __calculate_limits(self, projects):
        """
        Calculates the limits for the project sizes - the 25% percentile for
        'small' and the 75% percentile for big

        :param    projects:  The projects to analyse
        """
        total_loc = self.__gather_loc_per_lang(projects)

        for lang in total_loc:
            if len(total_loc[lang]) > 0:
                lower = percentile(total_loc[lang], 25)
                upper = percentile(total_loc[lang], 75)
                self.__limits[lang] = Limit(lower=lower, upper=upper)

    def scrab(self, report):
        """
        This task analyses the LOC of the different projects by main language
        and interface language. If the project is under the 25% percentile it
        is considered 'small' if it is over the 75% percentile it is considered
        'big'

        :param    report:       The report to analyse _and_ change

        :returns: Report that contains all scrabbed information
                  Example:
                    ProjectSizeCalculator:
                      C: big
                      total: normal
        """
        self.__calculate_limits(report['projects'])
        try:
            for project in report['projects']:
                project_report = report['projects'][project]
                try:
                    loc = self.__loc(project, project_report)
                    inter_langs = self.__inter_langs(project,
                                                     project_report)

                    inter_langs.append('total')
                    project_report['ProjectSizeCalculator'] = {}
                    size_report = project_report['ProjectSizeCalculator']

                    for lang in inter_langs:
                        if lang in self.__limits:
                            limit = self.__limits[lang]

                            if loc < limit.lower:
                                size_report[lang] = 'small'
                            elif loc > limit.upper:
                                size_report[lang] = 'big'
                            else:
                                size_report[lang] = 'normal'
                except MissingManualData as e:
                    pass  # we can't do nothing about it
        except Exception as e:
            raise Exception(
                "While calculating the project size for the project '{}' with "
                "the report\n{}".format(
                    project,
                    self.__projects[project])
            ) from e
        return report
