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


from scrabTasks.scrabTask import ReportTask

from scrabTasks.report.generateLaTeXOverviewTable import (
    get_project_id,
    get_project_name,
    get_project_features,
    get_project_licences,
    get_project_impact,
    has_interface_language)
from utils import containedStructure, tex_escape

from dateutil import parser


name = "GenerateLaTeXDetailTable"
version = "1.0.0"


def tex_url_escaple(url):
    return url.replace("%", r"\pcnt ").replace("_", r"\unsc ")


def shorten_language(language):
    """
    Shortens the language name to roughly 4 characters

    :param    language:  The language

    :returns: shortened language
    """
    if language == 'JavaScript':
        lang = 'JS'
    elif language == 'Objective-C':
        lang = 'ObjC'
    elif language == 'Swift':  # only small chars
        lang = 'Swift'
    elif language == 'Python':
        lang = 'Py'
    else:
        lang = language[:4]

    return tex_escape(lang)


def get_main_language(project_report):
    """
    Gets the main language from the project report - the data from GitHub /
    MetaDataCollector is preferred over the results from LanguageDetector

    :param    project_report:  The project report to get the main language from

    :returns: The main language.
    """
    required1 = {"MetaDataCollector": {"main_language": ""}}
    required2 = {"LanguageDetector": {"main_language": ""}}

    if containedStructure(required1, project_report):
        lang = project_report["MetaDataCollector"]["main_language"]
        return shorten_language(lang)
    elif containedStructure(required2, project_report):
        lang = project_report["LanguageDetector"]["main_language"]
        return shorten_language(lang)
    return '-'


def get_interface_languages(project_report):
    """
    Gets the interface languages from the project report.

    :param    project_report:  The project report to get the interface languages
                               from

    :returns: The interface languages as formatted TeX string
    """
    required = {"generalData": {"interfaceLanguage": []}}

    if not containedStructure(required, project_report):
        raise Exception(
            "There has to be an array with interface languages "
            "{generalData:{interfaceLanguage: [C, C++]}}")

    languages = project_report['generalData']['interfaceLanguage']
    out = "-"

    if len(languages) > 0:
        out = r"\specialcell{"
        out += tex_escape(languages[0])
        for lang in languages[1:]:
            out += r',\\' + tex_escape(lang)
        out += '}'
    return out


def get_interface_level(project_report):
    """
    Gets the interface level from the project report

    :param    project_report:  The project report to get the interface level
                               from

    :returns: The interface level as formatted TeX string
    """
    required = {"generalData": {"interfaceLevel": {
        "high": False,
        "low": False
    }}}

    if not containedStructure(required, project_report):
        return '-'

    high = project_report["generalData"]["interfaceLevel"]["high"]
    low = project_report["generalData"]["interfaceLevel"]["low"]

    if high and low:
        return r'\specialcell{High,\\Low}'
    elif high:
        return 'High'
    elif low:
        return 'Low'
    else:
        return '-'


def get_type(project_report):
    """
    Gets the type from the project report

    :param    project_report:  The project report to get the project type from

    :returns: The type as formatted string shortened to 4 characters
    """
    required = {"generalData": {"type": ""}}

    if not containedStructure(required, project_report):
        return '-'
    kind = project_report["generalData"]["type"]
    if len(kind) > 4:
        return kind[:4] + "."
    return kind


def get_project_report(project_reports, url):
    for project in project_reports:
        if url == project_reports[project]['url']:
            return project_reports[project]
    return None


def get_related(project_reports, project_report):
    """
    Gets the related projects from the project report

    :param    project_report:  The project report to get the related projects
                               from

    :returns: The related projects as formatted string
    """
    required = {"generalData": {"related": []}}

    if not containedStructure(required, project_report):
        return '-'

    rel = project_report["generalData"]["related"]
    out = "-"
    if len(rel) > 0:
        out = ""
        project = get_project_report(project_reports, rel[0])
        if project:
            out += str(get_project_id(project))
        else:
            out += r"\myURLBreaker{" + tex_url_escaple(rel[0]) + "}"
        for related in rel[1:]:
            project = get_project_report(project_reports, related)
            if project:
                out += ", " + str(get_project_id(project))
            else:
                out += r", \myURLBreaker{" + tex_url_escaple(related) + "}"
    return out


def get_dependency(project_report):
    """
    Gets the dependencies of the project from the project report

    :param    project_report:  The project report to get the dependencies from

    :returns: The dependencies of the project as formatted string
    """
    required = {"generalData": {"dependency": []}}

    if not containedStructure(required, project_report):
        return '-'

    dep = project_report["generalData"]["dependency"]
    out = "-"
    if len(dep) > 0:
        out = r"\myURLBreaker{" + tex_url_escaple(dep[0]) + "}"
        for dependency in dep[1:]:
            out += r", \myURLBreaker{" + tex_url_escaple(dependency) + "}"
    return out


def get_loc(project_report):
    """
    Gets the amount of lines of code from the project report

    :param    project_report:  The project report to get the lines of code from

    :returns: The amount of lines of code.
    """
    required = {"ProjectMetrics": {"loc": {"source": 0}}}

    if not containedStructure(required, project_report):
        return '-'

    return project_report["ProjectMetrics"]["loc"]["source"]


def get_kloc(project_report):
    """
    Calculates the amount of thousands of lines of code

    :param    project_report:  The project report to get the lines of code form

    :returns: The lines of code devided by 1000 - if the number is smaller than
              ten up to two decimal numbers are included in the result
    """
    kloc = get_loc(project_report)
    if isinstance(kloc, int):
        if kloc / 1000 > 10:
            kloc = int(kloc / 1000)
        else:
            kloc = float("{0:.2f}".format(kloc / 1000))
    return kloc


def get_authors(project_report):
    """
    Gets the amount of authors from the project report

    :param    project_report:  The project report to get the amount of authors
                               from

    :returns: The amount of authors
    """
    required = {"AuthorContributorCounter": {"author#": 0}}

    if not containedStructure(required, project_report):
        return '-'

    return project_report["AuthorContributorCounter"]["author#"]


def get_contributors(project_report):
    """
    Gets the amount of contributor from the project report

    :param    project_report:  The project report to get the amount of
                               contributor from

    :returns: The amount of contributor
    """
    required = {"AuthorContributorCounter": {"contributor#": 0}}

    if not containedStructure(required, project_report):
        return '-'

    return project_report["AuthorContributorCounter"]["contributor#"]


def get_people(project_report):
    """
    Formats the author and contributor amount to a special TeX table cell

    :param    project_report:  The project report to get the author and
                               contributor amounts from

    :returns: The author and contributor numbers in a special TeX table cell
    """
    return (
        r"\specialcell[l>{\raggedleft}p{\widthof{0000}}]{"
        + r"A&" + str(get_authors(project_report)) + r"\\"
        + r"C&" + str(get_contributors(project_report))
        + "}"
    )


def get_documentation(data, keys):
    """
    Formats the given keys to a TeX string if their value is True in the given
    dict

    :param    data:            The dict to get the values from
    :param    keys:            The keys to get the values for and format to TeX
                               if the value is true

    :returns: A special TeX table cell that contains all keys where the value
              was true
    """
    first = True
    one = True
    out = ""

    for k in keys:
        if data[k]:
            if not first:
                out += r",\\"
                one = False
            else:
                first = False
            out += tex_escape(k.capitalize())
    if not one:
        out = r"\specialcell{" + out + "}"
    return out


def get_documentation_kind(project_report):
    """
    Gets what kind of documentation is available for the project from the
    project report

    :param    project_report:  The project report to get the documentation kind
                               from

    :returns: A special TeX table cell with the kind of documentation that the
              project provides
    """
    required = {"generalData": {"documentation": {
        "exists": {
                "readme": False,
                "website": False,
                "download": False
                }}}}

    if not containedStructure(required, project_report):
        return '-'

    return get_documentation(
        project_report["generalData"]["documentation"]["exists"],
        ["readme", "website", "download"]
    )


def get_documentation_complete(project_report):
    """
    Gets how complete the documentation is for the project from the project
    report

    :param    project_report:  The project report to get the completeness of the
                               documentation from

    :returns: A special TeX table cell with the completeness of documentation
              that the project provides
    """
    required = {"generalData": {"documentation": {
        "completeness": {
                "apis": False,
                "examples": False,
                "explanations": False
                }}}}

    if not containedStructure(required, project_report):
        return '-'

    return get_documentation(
        project_report["generalData"]["documentation"]["completeness"],
        ["apis", "examples", "explanations"]
    )


def get_last_update(project_report):
    """
    Gets the date the last update was made from the project report

    :param    project_report:  The project report to get the date from

    :returns: The last update date as YYYY-MM-DD
    """
    required = {"ProjectDates": {"last_change": ""}}

    if not containedStructure(required, project_report):
        return '-'

    date = project_report["ProjectDates"]["last_change"]
    return parser.parse(date).strftime("%Y-%m-%d")


def get_ceation(project_report):
    """
    Gets the date the first update was made from the project report

    :param    project_report:  The project report to get the date from

    :returns: The first update date as YYYY-MM-DD
    """
    required = {"ProjectDates": {"first_change": ""}}

    if not containedStructure(required, project_report):
        return '-'

    date = project_report["ProjectDates"]["first_change"]
    return parser.parse(date).strftime("%Y-%m-%d")


def get_dates(project_report):
    """
    Gets the creation and last update dates from the project report

    :param    project_report:  The project report to get the dates from

    :returns: A special TeX table cell that contains the creation and last
              update dates
    """
    return (
        r"\specialcell{"
        + get_ceation(project_report)
        + r"\\"
        + get_last_update(project_report)
        + "}"
    )


def get_url(project_report):
    """
    Gets the URL from the project report

    :param    project_report:  The project report to get the URL from

    :returns: The URL as special TeX string
    """
    required = {"url": ""}

    if not containedStructure(required, project_report):
        return '-'

    return r"\myURLBreaker{" + tex_url_escaple(project_report['url']) + r"}"


def list_to_TeX(list_):
    """
    Converts a list of strings into a comma separated string with all special
    TeX characters escaped

    :param    list_:  The list to convert to a TeX string

    :returns: A string representation of the list
    """
    tex = "-"
    if isinstance(list_, list) and len(list_) > 0:
        tex = tex_escape(list_[0])
        for i in list_[1:]:
            tex += ', '
            tex += tex_escape(i)
    return tex


class TeXProject(object):

    """
    Convenience class that obtains all required information for the table from
    the provided project report

    :param    project_report:  The project report to get the information from
    """

    def __init__(self, project_reports, project_report):
        self.report = project_report
        self.id = get_project_id(project_report)
        self.name = get_project_name(project_report)
        self.interface_languages = get_interface_languages(project_report)
        self.main_language = get_main_language(project_report)
        self.interface_level = get_interface_level(project_report)
        self.type = get_type(project_report)
        self.related = get_related(project_reports, project_report)
        self.dependency = get_dependency(project_report)
        self.impact = get_project_impact(project_report)
        self.kloc = get_kloc(project_report)
        self.people = get_people(project_report)
        self.documentation_kind = get_documentation_kind(project_report)
        self.documentation_complete = get_documentation_complete(project_report)
        self.dates = get_dates(project_report)
        self.licence = get_project_licences(project_report)
        self.url = get_url(project_report)
        self.block_ciphers = list_to_TeX(
            get_project_features(project_report,
                                 ['block ciphers']))
        self.stream_ciphers = list_to_TeX(
            get_project_features(project_report,
                                 ['stream ciphers']))
        self.hash = list_to_TeX(
            get_project_features(project_report,
                                 ['hash']))
        self.encryption_modes = list_to_TeX(
            get_project_features(project_report,
                                 ['encryption modes']))
        self.message_authentication_codes = list_to_TeX(
            get_project_features(project_report,
                                 ['message authentication codes']))
        self.public_key_infrastructure = list_to_TeX(
            get_project_features(project_report,
                                 ['public key infrastructure']))
        self.public_key_cryptography = list_to_TeX(
            get_project_features(project_report,
                                 ['public key cryptography']))
        self.protocol = list_to_TeX(
            get_project_features(project_report,
                                 ['protocol']))


class GenerateLaTeXDetailTable(ReportTask):

    """
    Generates a LaTeX table that shows all gathered information about the
    projects. The table is not very compact and uses the page in landscape mode.

    Example:
        {
          \tiny
          \centering
          \tabulinesep=4pt
          \setlength{\tabcolsep}{.3em}
          \tabulinesep=.3em%
          \taburulecolor{gray}

          \begin{landscape}
            \begin{longtabu}{lYllllY[.7]Y[.7]rrrlllYY[1.5]}
              \taburowcolors2{white!95!LightGray..white!80!LightGray}
              \rowfont[c]{\bfseries}
              \firsthline\firsthline\firsthline
              ID
                & \cellcolor{white!85!LightGray}Name
                  & I.L.
                    & \cellcolor{white!85!LightGray}M.L.
                      & I.Lvl.
                        & \cellcolor{white!85!LightGray}Type
                          & Related
                            & \cellcolor{white!85!LightGray}Depen.
                              & Impact
                                & \cellcolor{white!85!LightGray}kLOC
                                  & People
                                    & \cellcolor{white!85!LightGray}Doc. Kind
                                      & Doc. Com.
                                        & \cellcolor{white!85!LightGray}Dates
                                          & Licence
                                            & \cellcolor{white!85!LightGray}URL\\
              006
                & \cellcolor{white!75!LightGray}\myTextBreaker{openssl}
                  & \specialcell{Java}
                    & \cellcolor{white!75!LightGray}C
                      & \specialcell{High,\\Low}
                        & \cellcolor{white!75!LightGray}Wrap
                          & -
                            & \cellcolor{white!75!LightGray}-
                              & 39.37
                                & \cellcolor{white!75!LightGray}396
                                  & \specialcell[l>{\raggedleft}p{\widthof{0000}}]{A&4\\C&369}
                                    & \cellcolor{white!75!LightGray}-
                                      & -
                                        & \cellcolor{white!75!LightGray}\specialcell{1998-12-21\\2017-08-09}
                                          & -
                                            & \cellcolor{white!75!LightGray}\myURLBreaker{https://github.com/openssl/openssl}\\
            \end{longtabu}
            \vskip-\lastskip\vspace*{-2\baselineskip}
            \addtocounter{table}{-1}
            \begin{longtabu}{lYY[2]YY[2]YYYY}
              \rowfont[c]{\bfseries}\taburowcolors2{white!95!LightGray..white!80!LightGray}
              {}
                & \cellcolor{white!85!LightGray}EAM
                  & Block Cipher
                    & \cellcolor{white!85!LightGray}Stream Ci.
                      & Hash
                        & \cellcolor{white!85!LightGray}MAC
                          & PKC
                            & \cellcolor{white!85!LightGray}PKI
                              & Protocol\\
              \hphantom{000}
                & \cellcolor{white!75!LightGray}HMAC, Poly1305
                  & AES, AES-128, AES-192, AES-256, Blowfish, DES, Triple DES, Camellia, CAST, IDEA, RC, SEED, ARIA, ARIA-128, ARIA-192, ARIA-256
                    & \cellcolor{white!75!LightGray}RC, ChaCha, Salsa
                      & MD5, SHA, SHA-1, SHA-2, SHA-3, SHA-256, SHA-512, SHAKE, BLAKE2, PBKDF2, RIPEMD, Whirlpool, scrypt
                        & \cellcolor{white!75!LightGray}HMAC, Poly1305
                          & RSA, DH, DSA, ECDH, ECDSA
                            & \cellcolor{white!75!LightGray}PKIX, SET, PKCS, CMP, OCSP, LDAP
                              & TLS, SSL, SSH\\
              \taburowcolors1{white..white}
              \rowfont{\normalsize}
              \caption{Detailed library overview}
              \label{tab:detailed-library-overview}\\
            \end{longtabu}
          \end{landscape}
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
        super(GenerateLaTeXDetailTable, self).__init__(name, version,
                                                       parameter,
                                                       global_args)
        self.__projects = None
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

    def __write_table_row(self, indent, columns, color):
        """
        Writes a table row.

        :param    indent:   The STARTING indent for the row
        :param    columns:  The column contents as a list
        :param    color:    The color that should be added to the even numbered
                            columns

        :returns: The table row as TeX string
        """
        row = ""
        even = True
        first = True
        for col in columns:
            part = "\n" + " " * indent
            if first:
                first = False
            else:
                part += "& "
            indent += 2
            even = not even
            if even:
                part += color
            part += str(col)
            row += part
        row += "\\\\"
        return row

    def __general_sub_row(self, project, table_head, new_language):
        """
        Creates the first row of the project which is a table itself with two
        rows. The information displayed in this row is everything but the
        features.

        :param    project:       The project that is described by the row
        :param    table_head:    Weather the row is the table head
        :param    new_language:  Weather the row is the start of a new language

        :returns: The row as TeX string
        """
        def head():
            color = r"\cellcolor{white!87!LightGray}"
            columns = ["ID", "Name", "I.L.", "M.L.", "I.Lvl.", "Type",
                       "Related", "Depen.", "Impact", "kLOC", "People",
                       "Doc. Kind", "Doc. Com.", "Dates", "Licence", "URL"]
            row = r"""
    \begin{longtabu}{lYllllY[.7]Y[.7]rrrlllYY[1.5]}
      \taburowcolors2{white!95!LightGray..white!80!LightGray}
      \rowfont[c]{\bfseries}"""
            if not table_head:
                row += r"""
      \firsthline"""
                if new_language:
                    row += r"""\firsthline\firsthline"""

            return row + self.__write_table_row(6, columns, color)

        def body():
            color = r"\cellcolor{white!75!LightGray}"
            columns = [project.id,
                       project.name,
                       project.interface_languages,
                       project.main_language,
                       project.interface_level,
                       project.type,
                       project.related,
                       project.dependency,
                       project.impact,
                       project.kloc,
                       project.people,
                       project.documentation_kind,
                       project.documentation_complete,
                       project.dates,
                       project.licence,
                       project.url]
            row = self.__write_table_row(6, columns, color)
            row += r"""
    \end{longtabu}"""
            return row

        return head() + body()

    def __features_sub_row(self, project, last):
        """
        Creates the second row of the project which is a table itself with two
        rows. The information displayed in this row are the features of the
        project.

        :param    project:  The project that is described by the row
        :param    last:     Weather the row is last one in the table

        :returns: The row as TeX string
        """
        def head():
            color = r"\cellcolor{white!87!LightGray}"
            columns = ["{}", "EAM", "Block Cipher", "Stream Ci.", "Hash",
                       "MAC", "PKC", "PKI", "Protocol"]

            row = r"""
    \begin{longtabu}{lYY[2]YY[2]YYYY}
      \rowfont[c]{\bfseries}\taburowcolors2{white!95!LightGray..white!80!LightGray}"""

            return row + self.__write_table_row(6, columns, color)

        def body():
            color = r"\cellcolor{white!75!LightGray}"
            columns = [r"\hphantom{000}",
                       project.message_authentication_codes,
                       project.block_ciphers,
                       project.stream_ciphers,
                       project.hash,
                       project.message_authentication_codes,
                       project.public_key_cryptography,
                       project.public_key_infrastructure,
                       project.protocol]

            return self.__write_table_row(6, columns, color)

        def tail():
            if last:
                TeXtail = r"""
      \taburowcolors1{white..white}
      \rowfont{\normalsize}
      \caption{Detailed library overview}
      \label{tab:detailed-library-overview}\\
    \end{longtabu}"""
                return TeXtail
            else:
                TeXtail = r"""
    \end{longtabu}"""
                return TeXtail
        return head() + body() + tail()

    def __project_row(self, project, table_head, new_language, last):
        """
        Creates a project row consisting of two tables with each 2 rows.

        :param    project:       The project that is described by the row
        :param    table_head:    Weather the row is the table head
        :param    new_language:  Weather the row is the start of a new language
        :param    last:          Weather the row is last one in the table

        :returns: The row as TeX string
        """
        row = ""
        row += self.__general_sub_row(project, table_head, new_language)
        row += r"""
    \vskip-\lastskip\vspace*{-2\baselineskip}
    \addtocounter{table}{-1}"""
        row += self.__features_sub_row(project, last)
        if not last:
            row += r"""
    \vskip-\lastskip\vspace*{-2\baselineskip}
    \addtocounter{table}{-1}"""

        return row

    def __detailed_tables(self):
        """
        Generates a table that displays 'all' information for all analysed
        projects

        :returns: TeX string that contains the table that displays 'all'
                  information of the analysed projects
        """
        table = r"""{
  \tiny
  \centering
  \tabulinesep=4pt
  \setlength{\tabcolsep}{.3em}
  \tabulinesep=.3em%
  \taburulecolor{gray}

  \begin{landscape}"""

        current = 0
        total = 0
        for lang in self.__projects:
            total += len(self.__projects[lang])

        table_head = True
        last = False
        for lang in self.__projects:
            projects = self.__projects[lang]
            new_language = True
            for project in projects:
                current += 1
                if current == total:
                    last = True
                try:
                    table += self.__project_row(project, table_head,
                                                new_language, last)
                except Exception as e:
                    raise Exception(
                        "While generating the row for the project '{}' with "
                        "the report\n{}".format(
                            project.name, project.report)
                    ) from e
                table_head = False
                new_language = False
        table += r"""
  \end{landscape}
}"""
        return table

    def __setup_projects(self, project_reports):
        """
        Generate and sorts a list of TeXProject that are created based on the
        project report data

        :param    project_reports:  The project reports that contain the
                                    information that will be used to create the
                                    table
        """
        meta_projects = {lang: [] for lang in self.__languages}

        for lang in self.__languages:
            for project in project_reports:
                report = project_reports[project]
                if has_interface_language(report, lang):
                    meta_projects[lang].append(
                        TeXProject(project_reports, report))

        for lang in meta_projects:
            meta_projects[lang] = sorted(
                meta_projects[lang],
                key=lambda p:
                p.impact if isinstance(p.impact, (int, float))
                else 0,
                reverse=True
            )
        self.__projects = meta_projects

    def __preamble(self):
        """
        Generates the preamble needed to compile the tables

        :returns: The preamble needed to compile the tables
        """
        return r"""\usepackage[hypertexnames=false]{hyperref}
\usepackage[svgnames,table]{xcolor}
\usepackage{longtable}
\usepackage{tabu}
\usepackage{array}
\usepackage{pdflscape}
\usepackage{calc}

\newcommand\myTextBreaker[1]{\tbhelp#1\relax\relax\relax}
\def\tbhelp#1#2\relax{{#1}\penalty0\ifx\relax#2\else\tbhelp#2\relax\fi}

\makeatletter
\catcode`\%=12
\newcommand\pcnt{\%}
\catcode`\%=14

\catcode`\_=12
\newcommand\unsc{\_}
\catcode`\_=8

\newcommand*\myURLBreaker{\myURLBreaker@iii\myURLBreaker@i}
\newcommand*\myURLBreaker@iii[1]{\begingroup\catcode`\_12\catcode`\%12 #1}
\newcommand*\myURLBreaker@i[1]{\href{#1}{\ubhelp#1\relax\relax\relax}\endgroup}
\def\ubhelp#1#2\relax{{#1}\penalty0\ifx\relax#2\else\ubhelp#2\relax\fi}
\makeatother

\newcolumntype{Y}{>{\let\newline\\\arraybackslash\hspace{0pt}}X}

\newcommand{\specialcell}[2][l]{%
  \setlength{\extrarowheight}{0pt}%
  \def\arraystretch{1}%
  \tabulinesep=.025em%
  \begin{tabular}[t]{@{}#1@{}}#2\end{tabular}%
}"""

    def scrab(self, report):
        """
        Generates overview tables for the interface languages of the projects.

        :param    report:  The report to analyse _and_ change

        :returns: Report that contains all scrabbed information and the overview
                  tables

                  Example:
                    GenerateLaTeXOverviewTable:
                      table: |-
                        {
                          \tiny
                          \centering
                          \tabulinesep=4pt
                          \setlength{\tabcolsep}{.3em}
                          \tabulinesep=.3em%
                          \taburulecolor{gray}

                          \begin{landscape}
                            \begin{longtabu}{lYllllY[.7]Y[.7]rrrlllYY[1.5]}
                              \taburowcolors2{white!95!LightGray..white!80!LightGray}
                              \rowfont[c]{\bfseries}
                              \firsthline\firsthline\firsthline
                              ID
                                & \cellcolor{white!85!LightGray}Name
                                  & I.L.
                                    & \cellcolor{white!85!LightGray}M.L.
                                      & I.Lvl.
                                        & \cellcolor{white!85!LightGray}Type
                                          & Related
                                            & \cellcolor{white!85!LightGray}Depen.
                                              & Impact
                                                & \cellcolor{white!85!LightGray}kLOC
                                                  & People
                                                    & \cellcolor{white!85!LightGray}Doc. Kind
                                                      & Doc. Com.
                                                        & \cellcolor{white!85!LightGray}Dates
                                                          & Licence
                                                            & \cellcolor{white!85!LightGray}URL\\
                              006
                                & \cellcolor{white!75!LightGray}\myTextBreaker{openssl}
                                  & \specialcell{Java}
                                    & \cellcolor{white!75!LightGray}C
                                      & \specialcell{High,\\Low}
                                        & \cellcolor{white!75!LightGray}Wrap
                                          & -
                                            & \cellcolor{white!75!LightGray}-
                                              & 39.37
                                                & \cellcolor{white!75!LightGray}396
                                                  & \specialcell[l>{\raggedleft}p{\widthof{0000}}]{A&4\\C&369}
                                                    & \cellcolor{white!75!LightGray}-
                                                      & -
                                                        & \cellcolor{white!75!LightGray}\specialcell{1998-12-21\\2017-08-09}
                                                          & -
                                                            & \cellcolor{white!75!LightGray}\myURLBreaker{https://github.com/openssl/openssl}\\
                            \end{longtabu}
                            \vskip-\lastskip\vspace*{-2\baselineskip}
                            \addtocounter{table}{-1}
                            \begin{longtabu}{lYY[2]YY[2]YYYY}
                              \rowfont[c]{\bfseries}\taburowcolors2{white!95!LightGray..white!80!LightGray}
                              {}
                                & \cellcolor{white!85!LightGray}EAM
                                  & Block Cipher
                                    & \cellcolor{white!85!LightGray}Stream Ci.
                                      & Hash
                                        & \cellcolor{white!85!LightGray}MAC
                                          & PKC
                                            & \cellcolor{white!85!LightGray}PKI
                                              & Protocol\\
                              \hphantom{000}
                                & \cellcolor{white!75!LightGray}HMAC, Poly1305
                                  & AES, AES-128, AES-192, AES-256, Blowfish, DES, Triple DES, Camellia, CAST, IDEA, RC, SEED, ARIA, ARIA-128, ARIA-192, ARIA-256
                                    & \cellcolor{white!75!LightGray}RC, ChaCha, Salsa
                                      & MD5, SHA, SHA-1, SHA-2, SHA-3, SHA-256, SHA-512, SHAKE, BLAKE2, PBKDF2, RIPEMD, Whirlpool, scrypt
                                        & \cellcolor{white!75!LightGray}HMAC, Poly1305
                                          & RSA, DH, DSA, ECDH, ECDSA
                                            & \cellcolor{white!75!LightGray}PKIX, SET, PKCS, CMP, OCSP, LDAP
                                              & TLS, SSL, SSH\\
                              \taburowcolors1{white..white}
                              \rowfont{\normalsize}
                              \caption{Detailed library overview}
                              \label{tab:detailed-library-overview}\\
                            \end{longtabu}
                          \end{landscape}
                        }
        """
        self.__setup_projects(report['projects'])
        report['GenerateLaTeXDetailTable'] = {}
        report['GenerateLaTeXDetailTable']['table'] = self.__detailed_tables()
        report['GenerateLaTeXDetailTable']['preamble'] = self.__preamble()
        return report
