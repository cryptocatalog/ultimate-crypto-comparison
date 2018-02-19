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


from argparse import ArgumentTypeError as err
import argparse
import sys
import os
import re


class PathType(object):
    """ Taken from http://stackoverflow.com/a/33181083/1935553"""

    def __init__(self, exists=True, type='file', dash_ok=True):
        """
        :param  exists:   True: a path that does exist
                          False: a path that does not exist, in a valid parent
                          directory
                          None: don't care
        :param  type:     file, dir, symlink, None, or a function returning
                          True for valid paths
                          None: don't care
        :param  dash_ok:  whether to allow "-" as stdin/stdout
        """

        assert exists in (True, False, None)
        assert type in ('file', 'dir', 'symlink', None)\
            or hasattr(type, '__call__')

        self._exists = exists
        self._type = type
        self._dash_ok = dash_ok
        self.__name__ = type

    def __call__(self, string):
        if string == '-':
            # the special argument "-" means sys.std{in,out}
            if self._type == 'dir':
                raise err(
                    'standard input/output (-) not allowed as directory path')
            elif self._type == 'symlink':
                raise err(
                    'standard input/output (-) not allowed as symlink path')
            elif not self._dash_ok:
                raise err('standard input/output (-) not allowed')
        else:
            path = os.path.expandvars(os.path.expanduser(string))
            e = os.path.exists(path)
            if self._exists:
                if not e:
                    raise err("path does not exist: '%s'" % string)

                if self._type is None:
                    pass
                elif self._type == 'file':
                    if not os.path.isfile(path):
                        raise err("path is not a file: '%s'" % string)
                elif self._type == 'symlink':
                    if not os.path.symlink(path):
                        raise err("path is not a symlink: '%s'" % string)
                elif self._type == 'dir':
                    if not os.path.isdir(path):
                        raise err("path is not a directory: '%s'" % string)
                elif not self._type(path):
                    raise err("path not valid: '%s'" % string)
            else:
                if not self._exists and self._exists is not None and e:
                    raise err("path exists: '%s'" % string)

                p = os.path.dirname(os.path.normpath(path)) or '.'
                if not os.path.isdir(p):
                    raise err("parent path is not a directory: '%s'" % p)
                elif not os.path.exists(p):
                    raise err("parent directory does not exist: '%s'" % p)
        return string


class SmartFormatter(argparse.MetavarTypeHelpFormatter):
    """
    Formatter class that handles line breaks in a non idiotic way
    """

    def _split_lines(self, text, width):
        out = []
        for line in text.splitlines():
            out.extend(argparse.MetavarTypeHelpFormatter._split_lines(
                self, line, width))
        return out


def __setup_parser():
    """
    Set up  of the argument parser

    :returns: argument parser
    """
    parser = argparse.ArgumentParser(
        description='ScrabGitRepos',
        formatter_class=SmartFormatter,
        add_help=False)

    required_args = parser.add_argument_group('Required arguments')
    required_args.add_argument('-t', '--tasks',
                               type=PathType(exists=True, type='file'),
                               default=None,
                               help="Path to the tasks.yaml file - can be "
                               "provided via configuration file")

    program_args = parser.add_argument_group('Program arguments')
    program_args.add_argument('-r', '--report',
                              type=PathType(exists=True, type='file'),
                              default=None,
                              help="Path to an old report as base")
    program_args.add_argument('-o', '--output',
                              type=PathType(exists=None, type='file'),
                              default=None,
                              help="Path where the report will be saved to")
    program_args.add_argument('-c', '--config',
                              type=PathType(exists=True, type='file'),
                              default=None,
                              help="Path to the configuration file - defaults "
                              "to './gitScrabber.conf'. Write the command "
                              "line arguments without leading dashes e.g.:\n"
                              "print\n"
                              "\tdata=/tmp")
    program_args.add_argument('-d', '--data',
                              type=PathType(exists=True, type='dir'),
                              default='.',
                              help="Directory where the repositories and "
                              "archives are stored")
    program_args.add_argument('-u', '--update',
                              action='store_true',
                              help="Before scrabbing the tool will try to "
                              "update the sources")
    program_args.add_argument('-p', '--print',
                              action='store_true',
                              default=False,
                              help="If the report should be printed to stdout "
                              "- defaults to false")
    program_args.add_argument('-f', '--force',
                              action='store_true',
                              default=False,
                              help="Forces the override of a present report "
                              "- defaults to false")
    program_args.add_argument('-h', '--help',
                              action='help',
                              help="Show this help message and exit")

    global_args = parser.add_argument_group('Global arguments')
    global_args.add_argument('--github-token',
                             type=str,
                             default=None,
                             help="Access token for github to work with a "
                             "higher query limit against their api")
    return parser


def __check_overwrite(parser, args):
    """
    Checks weather the --force flag was set without need or is missing to force
    an overwrite

    :param    parser:  The parser used to raise an error message
    :param    args:    The arguments that were passed to the program
    """
    if (args.force
        and (not args.output
             or args.output != args.report)):
        parser.error('Force is only needed to overwrite an existing report')
    elif (not args.force
          and args.output
          and args.output == args.report):
        parser.error('{} exists already! '
                     'Specify a new location for the new report or '
                     '--force override'.format(args.output))


def __check_tasks(parser, args):
    """
    Checks weather a --tasks file was provided

    :param    parser:  The parser used to raise an error message
    :param    args:    The arguments that were passed to the program
    """
    if not args.tasks:
        raise Exception("There was no tasks file provided - "
                        "you have to provide one.")


def __check_arguments(parser, args):
    """
    Check the given arguments for bade combinations

    :param  parser:  The parsed parser
    :param  args:    The arguments
    """
    __check_overwrite(parser, args)
    __check_tasks(parser, args)


def __load_config(config_path):
    """
    Loads the configuration options from file and extends the argument list that
    will be passed to the parser

    :param    config_path:  The path to the configuration file

    :returns: The argument list that will be parsed extended by the arguments in
              the configuration file
    """
    options = []
    with open(config_path) as f:
        config = f.readlines()
        for line in config:
            if re.match(r'^#', line):
                continue

            arg = line.strip().split(sep='=', maxsplit=1)
            if len(arg[0]) > 1:
                arg[0] = '--' + arg[0]
            else:
                arg[0] = '-' + arg[0]
            options.extend(arg)
    return options


def __replace_config_file(args):
    """
    Replaces the -c/--config argument with the arguments specified in the
    configuration file

    :param    args:  The arguments that will be parsed

    :returns: The argument list that will be parsed extended by the arguments in
              the configuration file
    """
    load_config = False
    out = []
    for option in args:
        if (option.startswith('-c')
                or option.startswith('--config')):
            load_config = True
        elif load_config:
            load_config = False
            out.extend(__load_config(option))
        else:
            out.append(option)
    return out


def parse_args(args=None):
    """
    Parses the arguments

    :param    args:  The command line arguments

    :returns: The parsed arguments
    """
    if args is None:
        args = sys.argv[1:]  # args default to the system args
    else:
        args = list(args)  # make sure that args are mutable

    if ('--config' not in args
            and '-c' not in args
            and os.path.isfile(os.getcwd()+'/gitScrabber.conf')):
        args.insert(0, '--config')
        args.insert(1, os.getcwd()+'/gitScrabber.conf')

    args = __replace_config_file(args)

    parser = __setup_parser()
    parsed_args = parser.parse_args(args)

    __check_arguments(parser, parsed_args)

    return parsed_args
