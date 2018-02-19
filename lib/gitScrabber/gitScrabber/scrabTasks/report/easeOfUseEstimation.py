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

name = "EaseOfUseEstimation"
version = "1.0.0"


class MissingManualData(Exception):
    """
    Helper class to filter specific exceptions
    """
    pass


class Limit():

    """
    Convenience class to hold the upper and lower limits of the project sizes

    :param  name:   The name
    :param  lower:  The lower
    :param  upper:  The upper
    """

    def __init__(self, name, lower, upper):
        self.name = name
        self.lower = lower
        self.upper = upper


class ScoreData():

    """
    Convenience class that gathers the necessary data for the ease of use
    estimation for the projects.

    :param    project_report:  The project report to gather the data from
    """

    def __init__(self, project_report):
        self.website = None
        self.download = None
        self.readme = None

        self.apis = None
        self.examples = None
        self.explanations = None

        self.high = None
        self.low = None

        self.__gather_existence(project_report)
        self.__gather_completness(project_report)
        self.__gather_interface_level(project_report)

    def __gather_existence(self, project_report):
        """
        Gathers the documentation existence data

        :param    project_report:  The project report to gather the data from
        """
        required = {'generalData': {'documentation': {
            'exists': {'readme': False,
                       'website': False,
                       'download': False}}}}
        if (not containedStructure(required, project_report)):
            raise MissingManualData(
                "Data for the ease of use calculation is missing - "
                "generalData.documentation.exists.*"
            )

        exists = project_report['generalData']['documentation']['exists']
        self.download = exists['download']
        self.readme = exists['readme']
        self.website = exists['website']

    def __gather_completness(self, project_report):
        """
        Gathers the documentation completeness data

        :param    project_report:  The project report to gather the data from
        """
        required = {'generalData': {'documentation': {
            'completeness': {'apis': False,
                             'examples': False,
                             'explanations': False}}}}
        if (not containedStructure(required, project_report)):
            raise MissingManualData(
                "Data for the ease of use calculation is missing - "
                "generalData.documentation.completeness.*"
            )

        comp = project_report['generalData']['documentation']['completeness']
        self.apis = comp['apis']
        self.examples = comp['examples']
        self.explanations = comp['explanations']

    def __gather_interface_level(self, project_report):
        """
        Gathers the projects interface level data

        :param    project_report:  The project report to gather the data from
        """
        required = {'generalData': {'interfaceLevel': {'high': False,
                                                       'low': False}}}
        if (not containedStructure(required, project_report)):
            raise MissingManualData(
                "Data for the ease of use calculation is missing - "
                "generalData.interfaceLevel.*"
            )

        inter = project_report['generalData']['interfaceLevel']
        self.high = inter['high']
        self.low = inter['low']


class Weight(object):

    """
    Convenience class that holds all weights needed for the ease of use
    estimation
    """

    def __init__(self):
        self.website = 3
        self.download = 2
        self.readme = 1

        self.apis = 3
        self.examples = 2
        self.explanations = 1

        self.high_low = 6
        self.high = 5
        self.low = 1


class EaseOfUseEstimation(ReportTask):

    """
    Class to estimate how easy it is to use a project.

    This is based on the following data:
      manual:
        generalData:
          documentation:
            exists:
              readme: false
              website: false
              download: false
            completeness:
              apis: false
              examples: false
              explanations: false
          interfaceLevel:
            high: true
            low: true

    Example:
      EaseOfUseEstimation: difficult


    :param  parameter:    Parameter given explicitly for this task, for all
                          projects, defined in the task.yaml
    :param  global_args:  Arguments that will be passed to all tasks. They
                          _might_ contain something that is useful for the task,
                          but the task has to check if it is _there_ as these
                          are user provided. If they are needed to work that
                          check should happen in the argHandler.
    """

    def __init__(self, parameter, global_args):
        super(EaseOfUseEstimation, self).__init__(name, version, parameter,
                                                  global_args)
        self.__limits = [
            Limit(name='easy', upper=24, lower=17),
            Limit(name='normal', upper=16, lower=9),
            Limit(name='difficult', upper=8, lower=1)
        ]
        self.__weight = Weight()

    def __estimate_ease_of_use(self, project_report):
        """
        Estimates how easy it is to use a project.

        The basic formula is existence * (completeness + level)

        :param    project_report:  The project report containing the data to
                                   base the estimation on

        :returns: The ease of use score
        """
        data = ScoreData(project_report)
        score = (
            data.apis*self.__weight.apis
            + data.examples*self.__weight.examples
            + data.explanations*self.__weight.explanations
        )

        if data.high and data.low:
            score += self.__weight.high_low
        elif data.high:
            score += self.__weight.high
        elif data.low:
            score += self.__weight.low

        if data.website:
            score *= self.__weight.website
        elif data.download:
            score *= self.__weight.download
        elif data.readme:
            score *= self.__weight.readme

        return score

    def scrab(self, report):
        """
        The scrab task estimates how easy it is to use a project.

        :param    report:       The report to analyse _and_ change

        :returns: Report that contains all scrabbed information
                  Example:
                    EaseOfUseEstimation: difficult
        """
        projects = report['projects']

        try:
            for project in projects:
                project_report = projects[project]
                eou_score = self.__estimate_ease_of_use(project_report)

                if eou_score is None:
                    continue

                for limit in self.__limits:
                    if(eou_score <= limit.upper
                       and eou_score >= limit.lower):
                        projects[project]['EaseOfUseEstimation'] = limit.name
        except Exception as e:
            raise Exception(
                "While estimating ease of use for the project '{}' with "
                "the report\n{}".format(
                    project,
                    projects[project])
            ) from e

        return report
