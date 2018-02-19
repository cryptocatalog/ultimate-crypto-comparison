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


from pyunpack import Archive
from urllib.request import urlopen, Request

import os
import regex
import shutil
import tempfile
import utils


class ProjectManager:
    """
    Interface class for Project manager
    """

    def init(self):
        """
        Initializes a project

        :returns: True if the sources were initialized,
                  otherwise False
        """
        assert False, "You have to implement this function"
        return True

    def update(self):
        """
        Updates or initializes a project

        :returns: True if the sources were updated or initialized,
                  otherwise False
        """
        assert False, "You have to implement this function"
        return True


class GitProjectManager(ProjectManager):

    """
    The GitProjectManager is a convenience class that provides the means to
    initialise and update a git project.

    :param  project:           The project the scrab tasks run for
    """

    def __init__(self, project):
        super(GitProjectManager, self).__init__()
        self.__project = project

    def __check_repo_folder(self):
        """
        Checks weather the repo folder of the project is indeed a git repo or a
        used folder

        :returns: True if it is a git repo folder False if the folder does not
                  exist

        :exception Exception:  If the folder exists and isn't a git repo
        """
        if os.path.isdir(self.__project.location + '/.git'):
            try:
                utils.run(
                    program='git', args=['status'],
                    cwd=self.__project.location)
            except Exception as e:
                raise Exception(
                    "The git repo '{}' seems to be corrupt "
                    "- please delete it.".format(self.__project.location))
            return True
        else:
            if os.path.isdir(self.__project.location):
                raise Exception("The directory '{}' is used and would be "
                                "overwritten when cloning.".format(
                                    self.__project.location)
                                )
            else:
                return False

    def __init_repo(self):
        """
        Initialises the repository by cloning into it
        """
        utils.run(
            program='git',
            args=[
                'clone',
                self.__project.url,
                self.__project.location
            ])

    def __update_repo(self):
        """
        Updates the git repo

        :returns: True if anything changed False if nothing changed
        """
        result = utils.run(
            program='git',
            args=['pull'],
            cwd=self.__project.location
        )
        if 'Already up-to-date.' in result:
            return False
        return True

    def update(self):
        """
        This function is responsible to ensure that the source files are
        present and up to date

        :returns: True if the sources were updated or initialized,
                  otherwise False
        """
        if self.__check_repo_folder():
            return self.__update_repo()
        else:
            self.__init_repo()
            return True

    def init(self):
        """
        Initializes a project

        :returns: True if the sources were initialized,
                  otherwise False
        """
        if not self.__check_repo_folder():
            self.__init_repo()
            return True
        return False


class SvnProjectManager(ProjectManager):

    """
    The SvnProjectManager is a convenience class that provides the means to
    initialise and update a svn project. This is done by using git-svn - that
    means the later scrab tasks will not work on a svn repository but a git one.

    :param  project:           The project the scrab tasks run for
    """

    def __init__(self, project):
        super(SvnProjectManager, self).__init__()
        self.__project = project

    def __check_repo_folder(self):
        """
        Checks weather the repo folder of the project is indeed a git repo or a
        used folder

        :returns: True if it is a git repo folder False if the folder does not
                  exist

        :exception Exception:  If the folder exists and isn't a git repo
        """
        if os.path.isdir(self.__project.location + '/.git'):
            try:
                utils.run(
                    program='git', args=['status'],
                    cwd=self.__project.location)
            except Exception as e:
                raise Exception(
                    "The git - svn repo '{}' seems to be corrupt "
                    "- please delete it.".format(self.__project.location))
            return True
        else:
            if os.path.isdir(self.__project.location):
                raise Exception("The directory '{}' is used and would be "
                                "overwritten when cloning.".format(
                                    self.__project.location)
                                )
            else:
                return False

    def __init_repo(self):
        """
        Initialises the repository by cloning into it
        """
        utils.run(
            program='git',
            args=[
                'svn',
                'clone',
                self.__project.url,
                self.__project.location
            ])

    def __update_repo(self):
        """
        Updates the git svn repo - by rebasing the current history on top of the
        history from the server

        :returns: True if anything changed False if nothing changed
        """
        result = utils.run(
            program='git',
            args=['svn', 'rebase'],
            cwd=self.__project.location
        )
        if regex.search(r"Current branch .* is up to date.", result):
            return False
        return True

    def update(self):
        """
        This function is responsible to ensure that the source files are
        present and up to date

        :returns: True if the sources were updated or initialized,
                  otherwise False
        """
        if self.__check_repo_folder():
            return self.__update_repo()
        else:
            self.__init_repo()
            return True

    def init(self):
        """
        Initializes a project

        :returns: True if the sources were initialized,
                  otherwise False
        """
        if not self.__check_repo_folder():
            self.__init_repo()
            return True
        return False


class ArchiveProjectManager(ProjectManager):
    """
    The ArchiveProjectManager is a convenience class that provides the means to
    initialise and update projects that are archives obtained from the web.

    :param  project:           The project the scrab tasks run for
    """

    def __init__(self, project):
        super(ArchiveProjectManager, self).__init__()
        self.__project = project

    def __project_cache_exists(self):
        """
        Validates if the cache folder for the project exists

        :returns: True if the cache folder for the project exists other wise
                  false
        """
        cache_dir = self.__project.location
        return os.path.isdir(cache_dir)

    def __download_archive(self):
        """
        Downloads the project archive to a temporary file

        :returns: The file name of the temporary file
        """
        url = self.__project.url
        tmp_archive, tmp_archive_name = tempfile.mkstemp(
            suffix=url.rsplit('/', 1)[-1])

        with urlopen(url) as response, open(tmp_archive, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        return tmp_archive_name

    def __extract_archive(self, archive):
        """
        Extracts the given archive to the projects cache folder

        :param    archive:  The archive to extract
        """
        cache_dir = self.__project.location
        Archive(archive).extractall(cache_dir)

    def __get_server_header(self):
        """
        Gets the server header for the archive with meta information

        :returns: The server header for the archive with meta information
        """
        req = Request(self.__project.url, method='HEAD')
        with urlopen(req) as response:
            return {k.lower(): v for k, v in dict(response.info()).items()}

    def __changed_server_file(self):
        """
        Checks if the file on the server has a different size that the local one
        had

        This is by no means a good way to check if there were changes, good
        enough for the 'moment'.

        :returns: True if the remote file size is not equal to the local one
        """
        header = self.__get_server_header()

        if 'content-length' not in header:
            return True

        server_size = header['content-length']
        cache_dir = self.__project.location

        with open(os.path.join(cache_dir, 'ArchiveSize.Scrab'), 'r') as f:
            if int(f.read()) != int(server_size):
                return True
        return False

    def __check_for_update(self):
        """
        Checks if an update of the source code is necessary

        :returns: True it the archive should be downloaded and replace the
                  current code
        """
        cache_dir = self.__project.location

        if(not self.__project_cache_exists()):
            return True
        elif not os.path.isfile(os.path.join(cache_dir, 'ArchiveSize.Scrab')):
            cache_dir = self.__project.location
            shutil.rmtree(cache_dir)
            return True
        else:
            return self.__changed_server_file()

    def __download_extract(self):
        """
        Downloads and extracts the archive
        """
        cache_dir = self.__project.location

        os.makedirs(cache_dir, exist_ok=True)
        try:
            tmp_archive = self.__download_archive()
            size_file = open(os.path.join(
                cache_dir, 'ArchiveSize.Scrab'), 'w')
            with size_file as f:
                f.write(str(os.path.getsize(tmp_archive)))
            self.__extract_archive(tmp_archive)
        finally:
            os.remove(tmp_archive)

    def update(self):
        """
        Updates / creates the archive if needed

        :returns: True if the sources were updated or initialized,
                  otherwise False
        """
        if self.__check_for_update():
            self.__download_extract()
            return True
        return False

    def init(self):
        """
        Initializes a project

        :returns: True if the sources were initialized,
                  otherwise False
        """
        meta_file = os.path.join(self.__project.location, 'ArchiveSize.Scrab')

        if(not self.__project_cache_exists() or not os.path.isfile(meta_file)):
            self.__download_extract()
            return True
        return False
