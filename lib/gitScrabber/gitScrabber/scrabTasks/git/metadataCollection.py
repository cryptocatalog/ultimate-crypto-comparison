"""
The MIT License (MIT)

Copyright (c) 2017 Rebecca Eichler
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

import requests

name = "MetaDataCollector"
version = "1.1.0"


class ProjectNotFromGithubException(Exception):
    pass


class MetaDataCollector(GitTask):
    """
    Class to query the github api to obtain the forks, languages, licence and
    stars of the given repo

    Example:
        MetaDataCollector:
          stars: 5161
          languages:
          - C
          - Perl
          main_language: C
          forks: 2661
          licence:
            name: Academic Free License v3.0
            abb: AFL-3.0

    :param  parameter:    Parameter given explicitly for this task, for all
                          projects, defined in the task.yaml
    :param  global_args:  This class makes use of the github-token to circumvent
                          the tight rate-limiting for the github api

                          https://github.com/settings/tokens
                          https://developer.github.com/v3/#authentication
    """

    def __init__(self,  parameter, global_args):
        super(MetaDataCollector, self).__init__(name, version, parameter,
                                                global_args)
        self.__project = None
        self.__queries = {}

    def __check_for_error(self, response, url):
        """
        Checks for errors in the response of the github api

        :param    response:  The response of the api query
        :param    url:       The query url as error information
        """
        if response.status_code < 200 or response.status_code >= 300:
            message = None
            response_json = response.json()

            if 'message' in response_json:
                message = response_json['message']

            if message:
                raise Exception(
                    "The error '{}'' occurred with the following message "
                    "'{}' while accessing '{}'".format(
                        response.status_code, message, url))
            else:
                raise Exception(
                    "The error '{}'' occurred while accessing '{}'".format(
                        response.status_code, url))

    def __generate_api_url(self, urlExtension):
        """
        Generates the github api query url.

        If a acces token was provided via 'github-token' it will be used here

        :param    urlExtension:  The url extension for the specific api point

        :returns: The url to query the github api
        """
        replaceStr = None
        trailing = False
        if self.__project.url.startswith('git@github.com:'):
            replaceStr = 'git@github.com:'
            trailing = True
        elif self.__project.url.startswith('https://github.com/'):
            replaceStr = 'https://github.com/'
        elif self.__project.url.startswith('http://github.com/'):
            replaceStr = 'http://github.com/'
        else:
            raise ProjectNotFromGithubException(
                "Unsupported project - it has to be a github project but "
                "the url '{}' seems to be not from github.".format(
                    self.__project.url))

        url = self.__project.url.replace(
            replaceStr, 'https://api.github.com/repos/')

        if trailing and url.endswith('.git'):
            url = url[:-4]

        url += urlExtension
        if self._global_args.github_token:
            url += "?access_token="+self._global_args.github_token

        return url

    def __access_github_api(self, urlExtension):
        """
        Accesses the github api for the provided url extension e.g.:
            urlExtension='/languages'
            =>
            https://api.github.com/repos//languages

        :param    urlExtension:  The url extension

        :returns: a json object or list depending on the url
        """
        url = self.__generate_api_url(urlExtension)

        response = requests.get(url)
        self.__check_for_error(response, url)

        return response.json()

    def __query(self, query):
        if query not in self.__queries:
            self.__queries[query] = self.__access_github_api(query)
        return self.__queries[
            query]

    def __get_language_data(self):
        """
        Queries the github api to obtain the languages used in the project

        :returns: the a list of languages used in the project
        """
        query = self.__query('/languages')

        languages = None
        main_language = None

        if len(query) > 0:
            languages = list(query.keys())
            main_language = max(query, key=query.get)

        return {
            'languages': languages,
            'main_language': main_language
        }

    def __get_forks_count(self):
        """
        Queries the github api to obtain the number of forks of the project

        :returns: either 0 or the nr of forks of the project
        """
        query = self.__query('')

        if 'forks' not in query:
            return 0
        else:
            return query['forks']

    def __get_stars(self):
        """
        Queries the github api to obtain the number of stars of the project

        :returns: either 0 or the nr of stars of the project
        """
        query = self.__query('')

        if 'stargazers_count' not in query:
            return 0
        else:
            return query['stargazers_count']

    def __get_licence(self):
        """
        Queries the github api to obtain the number of stars of the project

        :returns: either 0 or the nr of stars of the project
        """
        name = None
        abb = None

        query = self.__query('')
        if 'licence' in query:
            query = self.__query('/license')

            if ('license' in query and 'name' in query['license']
                    and 'Other' != query['license']['name']):
                name = query['license']['name']

                if 'spdx_id' in query['license']:
                    abb = query['license']['spdx_id']

        return {
            'name': name,
            'abb': abb
        }

    def scrab(self, project):
        """
        Queries the github api to obtain the forks, languages, licence and
        stars of the given repo

        :param    project:  The project

        :returns: The report of this task as a dictionary
                  Example:
                      MetaDataCollector:
                        stars: 5161
                        languages:
                        - C
                        - Perl
                        main_language: C
                        forks: 2661
                        licence:
                          name: Academic Free License v3.0
                          abb: AFL-3.0
        """
        report = {}

        try:
            self.__project = project
            language_data = self.__get_language_data()

            report['stars'] = self.__get_stars()
            report['languages'] = language_data['languages']
            report['main_language'] = language_data['main_language']
            report['forks'] = self.__get_forks_count()
            report['licence'] = self.__get_licence()
        except ProjectNotFromGithubException as e:
            pass

        return report
