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


from ..scrabTask import FileTask

from collections import Counter
from pkg_resources import resource_filename

import json
import math
import os
import regex


name = "LicenceDetector"
version = "1.0.3"


class MetaLicence():

    """
    Convenience object that contains the needed data for the licence matching

    :param  name:    The name of the licence
    :param  short:   The short name of the licence
    :param  length:  The length of the licence text
    :param  vector:  The vector of word counts of the licence text
    """

    def __init__(self, name, short, length, vector):
        self.name = name
        self.short = short
        self.length = length
        self.vector = vector


def mean(list):
    """
    Calculates the mean of numbers in a list

    :param    list:  The list containing the numbers to calculate the mean from

    :returns: The mean of the numbers in the list
    """
    return float(sum(list)) / max(len(list), 1)


class LicenceDetector(FileTask):

    """
    This tasks will match the files of a project against a set of common licence
    texts (provided by [1]) to give an overview of what the licence of the
    project probable is.

    Example:
      LicenceDetector:
        LICENSE:
        - licence: MIT License
          confidence: 99.58
          short: MIT
        - licence: JSON License
          confidence: 98.84
          short: JSON

    [1] https://github.com/spdx/license-list-data

    :param  parameter:    Parameter given explicitly for this task, for all
                          projects, defined in the task.yaml
    :param  global_args:  Arguments that will be passed to all tasks. They
                          _might_ contain something that is useful for the task,
                          but the task has to check if it is _there_ as these
                          are user provided. If they are needed to work that
                          check should happen in the argHandler.
    """

    def __init__(self, parameter, global_args):
        super(LicenceDetector, self).__init__(name, version, parameter,
                                              global_args)
        self.__word_regex = regex.compile(r'\w+')
        self.__licences = self.__generate_licences()

        self.__med_length = mean([node.length for node in self.__licences])
        self.__max_length = max(node.length for node in self.__licences)
        self.__report = {}

        self.__files = [
            '.h', '.hpp', '.hxx', '.rs', '.java', '.go', '.js', '.m', '.mm',
            '.C', '.swift', '.cs', '.php', '.phtml', '.php3', '.php4', '.php5',
            '.php7', '.phps', '.py', '.rb']

    def __read_licence(self, filepath):
        """
        Reads licence from the given path and creates the MetaLicence objects
        with word vectors that are later used to calculate the similarities

        :param    filepath:  The filepath to read the licences from

        :returns: A list of licence objects
        """
        licences = []
        with open(filepath, 'r') as fh:
            licence = json.load(fh)
            name = licence['name']
            short = licence['licenseId']

            if 'licenseText' in licence:
                licences.append(
                    MetaLicence(name,
                                short,
                                len(licence['licenseText']),
                                self.__text_to_vector(licence['licenseText'])))
            elif 'standardLicenseTemplate' in licence:
                licences.append(
                    MetaLicence(name,
                                short,
                                len(licence['standardLicenseTemplate']),
                                self.__text_to_vector(
                                    licence['standardLicenseTemplate'])))

            if 'standardLicenseHeader' in licence:
                licences.append(
                    MetaLicence(name+' Header',
                                short,
                                len(licence['standardLicenseHeader']),
                                self.__text_to_vector(
                                    licence['standardLicenseHeader'])))
        return licences

    def __generate_licences(self):
        """
        Generates the MetaLicence objects from the licence data

        :returns: List of licence objects
        """
        json_licence_dir = os.path.abspath(
            resource_filename('gitScrabber', 'license-list-data/json/details'))
        licences = []

        for file in os.listdir(json_licence_dir):
            if file.endswith(".json"):
                filepath = os.path.join(json_licence_dir, file)
                licences.extend(self.__read_licence(filepath))
        return licences

    def __calc_cosine(self, vec1, vec2):
        """
        Calculates the cosine similarity of two text vectors - taken from [1].
        This is the main slowdown of this task as the vector calculation is
        quite fast compared to the calculations that take place here.

        [1] https://stackoverflow.com/a/15174569/1935553

        :param    vec1:  The first vector that will be compared to the second
        :param    vec2:  The second vector that will be compared to the first

        :returns: The cosine similarity between the two vectors
        """
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum([vec1[x] * vec2[x] for x in intersection])

        sum1 = sum([vec1[x]**2 for x in vec1.keys()])
        sum2 = sum([vec2[x]**2 for x in vec2.keys()])
        denominator = math.sqrt(sum1) * math.sqrt(sum2)

        if not denominator:
            return 0.0
        else:
            return float(numerator) / denominator

    def __text_to_vector(self, text):
        """
        Converts text to a list of words and the number of occurrences

        :param    text:  The text to be converted to a list of words and their
                         number of occurrences

        :returns: List of words and their occurrences in the given text
        """
        words = self.__word_regex.findall(text.lower(), concurrent=True)
        return Counter(words)

    def scrab(self, project, filepath, file):
        """
        Generates a dict of licences that match the given file

        :param    project:   The project that the scrab task shall analyse
        :param    filepath:  The filepath to the file that can be analysed
        :param    file:      The file as string that can be analysed

        :returns: Report that contains the scrabbed info
        """

        filename, file_extension = os.path.splitext(filepath)
        filename = os.path.basename(filename)

        relative_path = filepath[len(project.location)+1:]

        if (file_extension not in self.__files
                and 'copying' not in filename.lower()
                and 'licence' not in filename.lower()
                and 'license' not in filename.lower()
                and 'acknowledgements' not in filename.lower()
                and 'acknowledgement' not in filename.lower()
                and 'readme' not in filename.lower()):
            return

        file_vec_med = self.__text_to_vector(
            file[:int(self.__med_length * 1.3)])
        file_vec_max = self.__text_to_vector(
            file[:int(self.__max_length * 1.3)])

        for licence in self.__licences:
            cosine = 0

            if licence.length < self.__med_length:
                cosine = self.__calc_cosine(file_vec_med, licence.vector)
            else:
                cosine = self.__calc_cosine(file_vec_max, licence.vector)

            if cosine > .95:
                if relative_path not in self.__report:
                    self.__report[relative_path] = []

                self.__report[relative_path].append({
                    'licence': licence.name,
                    'confidence': float("{0:.2f}".format(cosine*100)),
                    'short': licence.short
                })

        if relative_path in self.__report:
            self.__report[relative_path] = sorted(
                self.__report[relative_path],
                key=lambda k: k['confidence'], reverse=True)[:3]

    def report(self):
        """
        :returns: Report that contains all scrabbed information
                  Example:
                    LicenceDetector:
                      LICENSE:
                      - licence: MIT License
                        confidence: 99.58
                        short: MIT
                      - licence: JSON License
                        confidence: 98.84
                        short: JSON

        """
        return self.__report
