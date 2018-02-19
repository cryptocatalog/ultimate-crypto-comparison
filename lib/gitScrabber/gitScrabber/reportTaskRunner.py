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


class ReportTaskRunner:
    """
    The ReportTaskRunner executes the scrab tasks specified in the task.yaml
    file

    :param  tasks:             The task configuration
    :param  report:            The report to analyse and write into
    :param  global_args:       Arguments that will be passed to all tasks. They
                               _might_ contain something that is useful for the
                               task, but the task has to check if it is _there_
                               as these are user provided. If they are needed to
                               work that check should happen in the argHandler.
    :param  scrabTaskManager:  The scrab task manager
    """

    def __init__(self, tasks, report, global_args, scrabTaskManager):
        super(ReportTaskRunner, self).__init__()
        self.__tasks = tasks
        self.__report = report
        self.__global_args = global_args
        self.__scrabTaskManager = scrabTaskManager

    def run_tasks(self):
        """
        Executes the report scrab tasks sequentially
        """
        for task in self.__tasks:
            meta_task = self.__scrabTaskManager.get_task(task.name)
            scrab_task = meta_task.construct(task.parameter,
                                             self.__global_args)
            self.__report = scrab_task.scrab(self.__report)
