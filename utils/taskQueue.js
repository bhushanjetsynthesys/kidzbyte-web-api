const taskQueue = [];
const { logger } = require('./logger');

exports.addTasks = (tasks) => {
  for (const task of tasks) {
    taskQueue.push(task);
    logger.info(`TaskQueue: Newly added task: ${task.name} (Total: ${taskQueue.length})`);
  }
  logPendingTasks();
  runTask();
};

const runTask = () => {
  if (taskQueue.length === 0) return;
  const task = taskQueue.shift();
  task.run().finally(() => {
    const taskLength = taskQueue.length + 1;
    logger.info(`TaskQueue: Completed task: ${task.name} (Remaining: ${taskLength > 0 ? taskLength - 1 : taskLength})`);
    runTask();
  });
};

const logPendingTasks = () => {
  logger.info(`TaskQueue: Pending tasks: ${taskQueue.map((task) => task.name).join(', ')} (Total: ${taskQueue.length})`);
};
