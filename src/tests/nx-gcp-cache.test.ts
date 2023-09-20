import { NxJsonConfiguration } from '@nx/devkit';
import {
  ensureNxProject,
  readJson,
  runNxCommandAsync,
} from '@nx/plugin/testing';

describe('nx-gcp-cache e2e', () => {
  beforeAll(() => {
    ensureNxProject('nx-gcp-cache', '');

  });

  afterAll(async () => {
    runNxCommandAsync('reset');
  });

  it('should init nx-gcp-cache', async () => {
    const bucketName = 'bucket-name/cache-folder';
    await runNxCommandAsync(`generate nx-gcp-cache:init --gcpBucket=${bucketName}`);

    const nxJson: NxJsonConfiguration = readJson('nx.json');
    expect(nxJson.tasksRunnerOptions!.default.runner).toEqual('nx-gcp-cache');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(nxJson.tasksRunnerOptions!.default.options.gcpBucket).toEqual(bucketName);
  }, 120000);
});
