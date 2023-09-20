import { defaultTasksRunner } from '@nx/devkit';
import { TaskStatus, TasksRunner } from '@nx/workspace/src/tasks-runner/tasks-runner';
import { config as dotEnvConfig } from 'dotenv';

import { GcpCache } from './gcp-cache';
import { Logger } from './logger';
import { MessageReporter } from './message-reporter';
import { GcpNxCacheOptions } from './models/gcp-nx-cache-options.model';

dotEnvConfig();

function getOptions(options: GcpNxCacheOptions) {
  return {
    gcpBucket: process.env.NXCACHE_GCP_BUCKET ?? options.gcpBucket,
  };
}

// eslint-disable-next-line max-lines-per-function
export const tasksRunner = (
  tasks: Parameters<typeof defaultTasksRunner>[0],
  options: Parameters<typeof defaultTasksRunner>[1] & GcpNxCacheOptions,
  // eslint-disable-next-line no-magic-numbers
  context: Parameters<typeof defaultTasksRunner>[2],
) => {
  const gcpOptions: GcpNxCacheOptions = getOptions(options);
  const logger = new Logger();

  try {
    if (process.env.NXCACHE_GCP_DISABLE === 'true') {
      logger.note('USING LOCAL CACHE (NXCACHE_GCP_DISABLE is set to true)');

      return defaultTasksRunner(tasks, options, context) as TasksRunner;
    }

    logger.note('USING REMOTE CACHE');

    const messages = new MessageReporter(logger);
    const remoteCache = new GcpCache(gcpOptions, messages);

    const runner: Promise<{ [id: string]: TaskStatus }> = defaultTasksRunner(
      tasks,
      {
        ...options,
        remoteCache,
      },
      context,
    ) as Promise<{ [id: string]: TaskStatus }>;

    runner.finally(() => {
      async () => {
        await remoteCache.waitForStoreRequestsToComplete();
      };
      messages.printMessages();
    });

    return runner;
  } catch (err) {
    logger.warn((err as Error).message);
    logger.note('USING LOCAL CACHE');

    return defaultTasksRunner(tasks, options, context) as TasksRunner;
  }
};

export default tasksRunner;
