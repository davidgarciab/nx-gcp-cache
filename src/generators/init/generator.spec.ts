import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { InitGeneratorSchema } from './schema';

describe('init generator', () => {
  let appTree: Tree;
  const options: InitGeneratorSchema = {
    gcpBucket: 'bucket-name',
  };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should add nx-gcp-cache to nx.json', async () => {
    let nxJson = readJson(appTree, 'nx.json');
    expect(nxJson.tasksRunnerOptions.default.runner).toBe('nx/tasks-runners/default');

    await generator(appTree, options);

    nxJson = readJson(appTree, 'nx.json');

    expect(nxJson.tasksRunnerOptions.default.runner).toBe('nx-gcp-cache');
    expect(nxJson.tasksRunnerOptions.default.options.gcpBucket).toBe('bucket-name');
  });

  it('should add x-gcp-cache with no gcp options to nx.json', async () => {
    let nxJson = readJson(appTree, 'nx.json');
    expect(nxJson.tasksRunnerOptions.default.runner).toBe('nx/tasks-runners/default');

    await generator(appTree, {});

    nxJson = readJson(appTree, 'nx.json');

    expect(nxJson.tasksRunnerOptions.default.runner).toBe('nx-gcp-cache');
    expect(nxJson.tasksRunnerOptions.default.options.gcpBucket).toBeUndefined();
  });
});
