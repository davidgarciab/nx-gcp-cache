import { NxJsonConfiguration, getPackageManagerCommand } from '@nx/devkit';
import {
  cleanup,
  patchPackageJsonForPlugin,
  readJson,
  runCommandAsync,
  tmpProjPath,
} from '@nx/plugin/testing';
import { execSync } from 'child_process';
import { ensureDirSync } from 'fs-extra';
import { dirname } from 'node:path';

function runNxNewCommand() {
  const localTmpDir = dirname(tmpProjPath());

  return execSync(
    `npx nx new proj --nx-workspace-root=${localTmpDir} --no-interactive --skip-install --collection=@nx/workspace --npmScope=proj --preset=empty`,
    {
      cwd: localTmpDir,
    },
  );
}

function runPackageManagerInstall(silent: boolean = true) {
  const pmc = getPackageManagerCommand('npm');
  const install = execSync(pmc.install, {
    cwd: tmpProjPath(),
    ...(silent ? { stdio: ['ignore', 'ignore', 'ignore'] } : {}),
  });

  return install ? install.toString() : '';
}

describe('nx-gcp-cache e2e', () => {
  beforeAll(() => {
    ensureDirSync(tmpProjPath());
    cleanup();
    runNxNewCommand();
    patchPackageJsonForPlugin('nx-gcp-cache', '');
    runPackageManagerInstall();
  });

  afterAll(async () => {
    await runCommandAsync('npx nx reset');
  });

  it('should init nx-gcp-cache', async () => {
    const bucketName = 'bucket-name/cache-folder';
    await runCommandAsync(`npx nx generate nx-gcp-cache:init --gcpBucket=${bucketName}`);

    const nxJson: NxJsonConfiguration = readJson('nx.json');
    expect(nxJson.tasksRunnerOptions!.default.runner).toEqual('nx-gcp-cache');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(nxJson.tasksRunnerOptions!.default.options.gcpBucket).toEqual(bucketName);
  }, 120000);
});
