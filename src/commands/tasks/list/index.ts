import chalk from "chalk";
import meow from "meow";

import { CommandExecutor } from "../../../helpers/command-helper";
import { COMMAND_NAME } from "../../../helpers/constants";
import { getTasksV1Client } from "../../../helpers/google-helper";
import { printTaskListItems } from "../../../helpers/tasks-helper";

interface ListFlags {
  list?: string;
  showAll?: boolean;
}

const executeCommand: CommandExecutor = async () => {
  const cli = meow(
    `
    ${chalk.underline(`Usage`)}
      $ ${COMMAND_NAME} tasks list [options]

    ${chalk.underline("Global Options")}
      --help, -h      Show help text

    ${chalk.underline("Options")}
      --list, -l      Which list to show the task from
      --showAll, -a   Show hidden tasks as well

    ${chalk.underline("Examples")}
      List all tasks from all lists
      $ ${COMMAND_NAME} tasks list

      List all tasks from the 'House Projects' list
      $ ${COMMAND_NAME} tasks list --list 'House Projects'
  `,
    {
      description: "Show all tasks",
      flags: {
        help: {
          alias: "h",
          type: "boolean",
        },
        list: {
          alias: "l",
          type: "string",
        },
        showAll: {
          alias: "a",
          type: "boolean",
        },
      },
    }
  );

  await listTasks(cli.flags);
};

const listTasks = async (flags: ListFlags) => {
  const TasksV1 = getTasksV1Client();
  let {
    data: { items: lists },
  } = await TasksV1.tasklists.list();

  if (flags.list) {
    lists = [
      lists.find((l) => l.title.toLowerCase() === flags.list.toLowerCase()),
    ];
  }

  const taskLists = await Promise.all(
    lists.map((list) =>
      TasksV1.tasks
        .list({
          tasklist: list.id,
          showCompleted: true,
          showDeleted: flags.showAll,
          showHidden: flags.showAll,
        })
        .then((list) => list.data.items)
    )
  );

  lists.forEach((list, idx) => printTaskListItems(list, taskLists[idx]));
};

export default executeCommand;
