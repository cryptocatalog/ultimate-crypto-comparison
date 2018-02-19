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
import regex
import os

name = "ProjectMetrics"
version = "1.0.1"


class ProjectMetrics(FileTask):
    """
    The task counts the LOC with and without comments as well as the number of
    source files and total files to provide an indication of the size of the
    given project

    Example:
        ProjectMetrics:
          files:
            total: 19138
            source: 1142
          loc:
            source: 397700
            cleaned: 361992

    :param  parameter:    Parameter given explicitly for this task, for all
                          projects, defined in the task.yaml
    :param  global_args:  Arguments that will be passed to all tasks. They
                          _might_ contain something that is useful for the task,
                          but the task has to check if it is _there_ as these
                          are user provided. If they are needed to work that
                          check should happen in the argHandler.
    """

    def __init__(self, parameter, global_args):

        super(ProjectMetrics, self).__init__(name, version, parameter,
                                             global_args)
        self.__queries = self.__generate_queries()
        self.__total_files = 0
        self.__source_files = 0
        self.__source_loc = 0
        self.__cleaned_loc = 0

    def __c_style_comment_query(self):
        """
        Regex to remove c style comments from a string. This is a modified /
        improved version of the code found at [1]. Mainly the newlines from
        comments are also removed if this line was only used by a comment.

        [1] https://www.saltycrane.com/blog/2007/11/remove-c-comments-python/

        :returns: Regex with match group 1 that contains all code that is not a
                  comment
        """
        pattern = r"""
                             ## ---- SOLITARY MULTI LINE COMMENT ----
            ^[\t\f\v ]*      ##  Start with only spaces on line
            /\*              ##  Start of /* ... */ comment
            [^*]*\*+         ##  Non-* followed by 1-or-more *'s
            (?:              ##
              [^/*][^*]*\*+  ##
            )*               ##  0-or-more things which don't start with /
                             ##     but do end with '*'
            /                ##  End of /* ... */ comment
            \n               ##  match trailing new line as this line was only
                             ##     used for a comment
          |                  ## ---------------- OR ----------------
                             ## ---- MULTI LINE COMMENT ----
            /\*              ##  Start of /* ... */ comment
            [^*]*\*+         ##  Non-* followed by 1-or-more *'s
            (?:              ##
              [^/*][^*]*\*+  ##
            )*               ##  0-or-more things which don't start with /
                             ##     but do end with '*'
            /                ##  End of /* ... */ comment
          |                  ## ---------------- OR ----------------
                             ## ---- SOLITARY SINGLE LINE COMMENT ----
             ^[\t\f\v ]*     ##  Start with only spaces on line
             //              ##  Single line comment
             [^\n]*          ##  match anything but new line
             \n              ##  match trailing new line as this line was only
                             ##     used for a comment
          |                  ## ---------------- OR ----------------
                             ## ---- SINGLE LINE COMMENT ----
             //              ##  Single line comment
             [^\n]*          ##  match anything but new line
          |                  ## ---------------- OR ----------------
            (                ## ---- " ... " STRING ----
              "              ##  Start of " ... " string
              (?:            ##
                (?:          ##
                  \\.        ##  Escaped char
                )*           ##
              |              ## ---------------- OR ----------------
                [^"\\]*      ##  Non "\ characters
              )*             ##
              "              ##  End of " ... " string
            |                ## ---------------- OR ----------------
                             ## ---- ' ... ' STRING ----
              '              ##  Start of ' ... ' string
              (?:            ##
                (?:          ##
                  \\.        ##  Escaped char
                )*           ##
              |              ## ---------------- OR ----------------
                [^'\\]*      ##  Non '\ characters
              )*             ##
              '              ##  End of ' ... ' string
            |                ## ---------------- OR ----------------
                             ## ---- ANYTHING ELSE ----
              .              ##  Anything other char
              [^/"'\\]*      ##  Chars which doesn't start a comment, string
            )                ##    or escape
        """
        flags = regex.VERBOSE | regex.MULTILINE | regex.DOTALL
        return regex.compile(pattern, flags)

    def __php_style_comment_query(self):
        """
        Regex to remove php style comments from a string. This is a modified /
        improved version of the code found at [1]. Mainly the newlines from
        comments are also removed if this line was only used by a comment.

        [1] https://www.saltycrane.com/blog/2007/11/remove-c-comments-python/

        :returns: Regex with match group 1 that contains all code that is not a
                  comment
        """
        pattern = r"""
                             ## ---- SOLITARY MULTI LINE COMMENT ----
            ^[\t\f\v ]*      ##  Start with only spaces on line
            /\*              ##  Start of /* ... */ comment
            [^*]*\*+         ##  Non-* followed by 1-or-more *'s
            (?:              ##
              [^/*][^*]*\*+  ##
            )*               ##  0-or-more things which don't start with /
                             ##     but do end with '*'
            /                ##  End of /* ... */ comment
            \n               ##  match trailing new line as this line was only
                             ##     used for a comment
          |                  ## ---------------- OR ----------------
                             ## ---- MULTI LINE COMMENT ----
            /\*              ##  Start of /* ... */ comment
            [^*]*\*+         ##  Non-* followed by 1-or-more *'s
            (?:              ##
              [^/*][^*]*\*+  ##
            )*               ##  0-or-more things which don't start with /
                             ##     but do end with '*'
            /                ##  End of /* ... */ comment
          |                  ## ---------------- OR ----------------
                             ## ---- SOLITARY SINGLE LINE COMMENT ----
             ^[\t\f\v ]*     ##  Start with only spaces on line
             //              ##  Single line comment
             [^\n]*          ##  match anything but new line
             \n              ##  match trailing new line as this line was only
                             ##     used for a comment
          |                  ## ---------------- OR ----------------
                             ## ---- SINGLE LINE COMMENT ----
             //              ##  Single line comment
             [^\n]*          ##  match anything but new line
          |                  ## ---------------- OR ----------------
                             ## ---- SOLITARY SINGLE LINE COMMENT ----
             ^[\t\f\v ]*     ##  Start with only spaces on line
             \#              ##  Single line comment
             [^\n]*          ##  match anything but new line
             \n              ##  match trailing new line as this line was only
                             ##     used for a comment
          |                  ## ---------------- OR ----------------
                             ## ---- SINGLE LINE COMMENT ----
             \#              ##  Single line comment
             [^\n]*          ##  match anything but new line
          |                  ## ---------------- OR ----------------
            (                ## ---- " ... " STRING ----
              "              ##  Start of " ... " string
              (?:            ##
                 (?:         ##
                   \\.       ##  Escaped char
                 )*          ##
              |              ## ---------------- OR ----------------
                [^"\\]*      ##  Non "\ characters
              )*             ##
              "              ##  End of " ... " string
            |                ## ---------------- OR ----------------
                             ## ---- ' ... ' STRING ----
              '              ##  Start of ' ... ' string
              (?:            ##
                 (?:         ##
                   \\.       ##  Escaped char
                 )*          ##
              |              ## ---------------- OR ----------------
                [^'\\]*      ##  Non '\ characters
              )*             ##
              '              ##  End of ' ... ' string
            |                ## ---------------- OR ----------------
                             ## ---- ANYTHING ELSE ----
              .              ##  Anything other char
              [^/"'\\]*      ##  Chars which doesn't start a comment, string
            )                ##    or escape
        """
        flags = regex.VERBOSE | regex.MULTILINE | regex.DOTALL
        return regex.compile(pattern, flags)

    def __python_style_comment_query(self):
        """
        Regex to remove python style comments from a string. This is a modified
        / improved version of the code found at [1]. Mainly the newlines from
        comments are also removed if this line was only used by a comment.

        [1] https://www.saltycrane.com/blog/2007/11/remove-c-comments-python/

        :returns: Regex with match group 1 that contains all code that is not a
                  comment
        """
        pattern = r"""
                              ## ---- ""DocString"" ----
            ^[\t\f\v ]*       ##  Start with only spaces on line
            \"\"\"            ##  Start of DocString comment
            .*?               ##  Anything
            \"\"\"            ##  End of DocString comment
            \n                ##  match trailing new line as this line was
                              ##    only used for a comment
          |                   ## ---------------- OR ----------------
                              ## ---- ''DocString'' ----
            ^[\t\f\v ]*       ##  Start with only spaces on line
            \'\'\'            ##  Start of DocString comment
            .*?               ##  Anything
            \'\'\'            ##  End of DocString comment
            \n                ##  match trailing new line as this line was
                              ##    only used for a comment
          |                   ## ---------------- OR ----------------
                              ## ---- SOLITARY SINGLE LINE COMMENT ----
             ^[\t\f\v ]*      ##  Start with only spaces on line
             \#               ##  Single line comment
             [^\n]*           ##  match anything but new line
             \n               ##  match trailing new line as this line was
                              ##    only used for a comment
          |                   ## ---------------- OR ----------------
                              ## ---- SINGLE LINE COMMENT ----
             \#               ##  Single line comment
             [^\n]*           ##  match anything but new line
          |                   ## ---------------- OR ----------------
            (                 ## ---- ""Multiline String"" ----
                \"\"\"        ##  Start of Multiline String comment
                .*?           ##  Anything
                \"\"\"        ##  End of /* ... */ comment
              |               ## ---------------- OR ----------------
                              ## ---- ''Multiline String'' ----
                \'\'\'        ##  Start of Multiline String comment
                .*?           ##  Anything
                \'\'\'        ##  End of /* ... */ comment
              |               ## ---------------- OR ----------------
                \"            ## ---- " ... " STRING ----
                  (?:         ##
                    (?:       ##
                      \\.     ##  Escaped char
                    )*        ##
                  |           ## ---------------- OR ----------------
                    [^"\\]*   ##  Non "\ characters
                  )*          ##
                \"            ##  End of " ... " string
              |               ## ---------------- OR ----------------
                \'            ## ---- ' ... ' STRING ----
                  (?:         ##
                    (?:       ##
                      \\.     ##  Escaped char
                    )*        ##
                  |           ## ---------------- OR ----------------
                    [^'\\]*   ##  Non "\ characters
                  )*          ##
                \'            ##  End of ' ... ' string
              |               ## ---------------- OR ----------------
                              ## ---- ANYTHING ELSE ----
                .             ##  Anything other char
            )                 ##
        """
        return regex.compile(pattern, regex.VERBOSE | regex.MULTILINE
                             | regex.DOTALL)

    def __ruby_style_comment_query(self):
        """
        Regex to remove ruby style comments from a string. This is a modified
        / improved version of the code found at [1]. Mainly the newlines from
        comments are also removed if this line was only used by a comment.

        this regex is not perfect, but probable good enough - string literals
        are messed up in ruby, see [2]. As far as our usages this *should* be
        fine tough.

        [1] https://www.saltycrane.com/blog/2007/11/remove-c-comments-python/
        [2] http://docs.huihoo.com/ruby/ruby-man-1.4/syntax.html#string

        :returns: Regex with match group 1 that contains all code that is not a
                  comment
        """
        pattern = r"""
                              ## ---- ""DocString"" ----
            ^[\t\f\v ]*       ##  Start with only spaces on line
            =begin            ##  Start of DocString comment
            .*?               ##  Anything
            =end              ##  End of DocString comment
            \n                ##  match trailing new line as this line was only
                              ##      used for a comment
          |                   ## ---------------- OR ----------------
                              ## ---- SOLITARY SINGLE LINE COMMENT ----
             ^[\t\f\v ]*      ##  Start with only spaces on line
             \#               ##  Single line comment
             [^\n]*           ##  match anything but new line
             \n               ##  match trailing new line as this line was only
                              ##      used for a comment
          |                   ## ---------------- OR ----------------
                              ## ---- SINGLE LINE COMMENT ----
             \#               ##  Single line comment
             [^\n]*           ##  match anything but new line
          |                   ## ---------------- OR ----------------
            (                 ##
                              ## ---- ""Multiline String"" ----
                \"            ## ---- " ... " STRING ----
                  (?:         ##
                    (?:       ##
                      \\.     ##  Escaped char
                    )*        ##
                  |           ## ---------------- OR ----------------
                    [^"\\]*    ##  Non "\ characters
                  )*          ##
                \"            ##  End of " ... " string
              |               ## ---------------- OR ----------------
                \'            ## ---- ' ... ' STRING ----
                  (?:         ##
                    (?:       ##
                      \\.     ##  Escaped char
                    )*        ##r
                  |           ## ---------------- OR ----------------
                    [^"\\]*   ##  Non "\ characters
                  )*          ##
                \'            ##  End of ' ... ' string
              |               ## ---------------- OR ----------------
                \%[qQ]?       ## ---- Special Ruby String ----
                ([^\(\{\<\[]) ##  String start character
                .*?           ##  Anything
                \2            ##  End start character
              |               ## ---------------- OR ----------------
                \%[qQ]?       ## ---- Special Ruby String ----
                \(            ##  String start character
                .*?           ##  Anything
                \)            ##  End start character
              |               ## ---------------- OR ----------------
                \%[qQ]?       ## ---- Special Ruby String ----
                \{            ##  String start character
                .*?           ##  Anything
                \}            ##  End start character
              |               ## ---------------- OR ----------------
                \%[qQ]?       ## ---- Special Ruby String ----
                \[            ##  String start character
                .*?           ##  Anything
                \]            ##  End start character
              |               ## ---------------- OR ----------------
                \%[qQ]?       ## ---- Special Ruby String ----
                \<            ##  String start character
                .*?           ##  Anything
                \>            ##  End start character
              |               ## ---------------- OR ----------------
                              ## ---- ANYTHING ELSE ----
                .             ##  Anything other char
            )                 ##
        """
        return regex.compile(pattern, regex.VERBOSE | regex.MULTILINE
                             | regex.DOTALL)

    def __generate_queries(self):
        """
        Generates the regex queries used for the removal of comments from source
        code

        :returns: Dictionary with the regex query as key and the file extension
                  as list, that this query is intended to be used on, as value
        """
        queries = {}
        queries[self.__c_style_comment_query()] = [
            '.c', '.h', '.cpp', '.c++', '.cc', '.cxx', '.hpp', '.hxx', '.rs',
            '.java', '.go', '.js', '.m', '.mm', '.C', '.swift', '.cs'
        ]
        queries[self.__php_style_comment_query()] = [
            '.php', '.phtml', '.php3', '.php4', '.php5', '.php7', '.phps'
        ]
        queries[self.__python_style_comment_query()] = ['.py']
        queries[self.__ruby_style_comment_query()] = ['.rb']
        return queries

    def __remove_comments(self, query, text):
        """
        Removes comments from the given text by applying the regex query

        :param    query:  The query to use on the text
        :param    text:   The text to remove the comments from

        :returns: Text without comments
        """
        noncomments = [m.group(1)
                       for m in query.finditer(text, concurrent=True)
                       if m.group(1)]

        return "".join(noncomments)

    def scrab(self, project, filepath, file):
        """
        Counts the LOC with and without comments as well as the number of source
        files and total files

        :param    project:   The project that the scrab task shall analyse
        :param    filepath:  The filepath to the file that can be analysed
        :param    file:      The file as string that can be analysed

        :returns: Report that contains the scrabbed information of *this* file
        """
        filename, file_extension = os.path.splitext(filepath)
        for query in self.__queries:
            if file_extension in self.__queries[query]:
                cleand = self.__remove_comments(query, file)

                self.__total_files += 1
                self.__source_files += 1
                self.__source_loc += file.rstrip().count('\n')
                self.__cleaned_loc += cleand.rstrip().count('\n')

    def report(self):
        """
        :returns: Report that contains all scrabbed information
                  Example:
                      ProjectMetrics:
                        files:
                          total: 19138
                          source: 1142
                        loc:
                          source: 397700
                          cleaned: 361992
        """
        return {
            'files': {
                'total': self.__total_files,
                'source': self.__source_files
            },
            'loc': {
                'source': self.__source_loc,
                'cleaned': self.__cleaned_loc
            }
        }
