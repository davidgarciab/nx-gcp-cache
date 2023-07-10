import { Bucket, Storage } from '@google-cloud/storage';
import { RemoteCache } from '@nx/workspace/src/tasks-runner/default-tasks-runner';
import { writeFile } from 'fs';
import { join } from 'path';
import { create, extract } from 'tar';
import { promisify } from 'util';

import { Logger } from './logger';
import { MessageReporter } from './message-reporter';
import { GcpNxCacheOptions } from './models/gcp-nx-cache-options.model';

export class GcpCache implements RemoteCache {
  private readonly bucket: string;
  private readonly path: string;
  private readonly gcsClient: Bucket;
  private readonly logger = new Logger();
  private readonly uploadQueue: Array<Promise<boolean>> = [];

  public constructor(
    options: GcpNxCacheOptions,
    private messages: MessageReporter,
  ) {
    const gcpBucket = options.gcpBucket ?? '';
    const bucketTokens = gcpBucket.split('/');
    this.bucket = bucketTokens.shift() as string;
    this.path = bucketTokens.join('/');
    this.gcsClient = new Storage().bucket(this.bucket, {});
  }

  public checkConfig(options: GcpNxCacheOptions): void {
    const missingOptions: Array<string> = [];

    if (!options.gcpBucket) {
      missingOptions.push('NXCACHE_GCP_BUCKET | gcpBucket');
    }

    if (missingOptions.length > 0) {
      throw new Error(`Missing GCP options: \n\n${missingOptions.join('\n')}`);
    }
  }

  // eslint-disable-next-line max-statements
  public async retrieve(hash: string, cacheDirectory: string): Promise<boolean> {
    try {
      this.logger.debug(`Storage Cache: Downloading ${hash}`);

      const tgzFilePath: string = this.getTgzFilePath(hash, cacheDirectory);

      if (!(await this.checkIfCacheExists(hash))) {
        this.logger.debug(`Storage Cache: Cache miss ${hash}`);

        return false;
      }

      await this.downloadFile(hash, tgzFilePath);
      await this.extractTgzFile(tgzFilePath, cacheDirectory);
      await this.createCommitFile(hash, cacheDirectory);

      this.logger.debug(`Storage Cache: Cache hit ${hash}`);

      return true;
    } catch (err) {
      this.messages.error = err as Error;
      this.logger.debug(`Storage Cache: Cache error ${hash}`);
      return false;
    }
  }

  public store(hash: string, cacheDirectory: string): Promise<boolean> {
    if (this.messages.error) {
      return Promise.resolve(false);
    }

    const resultPromise = this.createAndUploadFile(hash, cacheDirectory);

    this.uploadQueue.push(resultPromise);

    return resultPromise;
  }

  public async waitForStoreRequestsToComplete(): Promise<void> {
    await Promise.all(this.uploadQueue);
  }

  private async createAndUploadFile(hash: string, cacheDirectory: string): Promise<boolean> {
    try {
      const tgzFilePath = this.getTgzFilePath(hash, cacheDirectory);

      await this.createTgzFile(tgzFilePath, hash, cacheDirectory);
      await this.uploadFile(hash, tgzFilePath);

      return true;
    } catch (err) {
      this.messages.error = err as Error;

      return false;
    }
  }

  private async createTgzFile(
    tgzFilePath: string,
    hash: string,
    cacheDirectory: string,
  ): Promise<void> {
    try {
      await create(
        {
          gzip: true,
          file: tgzFilePath,
          cwd: cacheDirectory,
        },
        [hash],
      );
    } catch (err) {
      throw new Error(`Error creating tar.gz file - ${err}`);
    }
  }

  private async extractTgzFile(tgzFilePath: string, cacheDirectory: string): Promise<void> {
    try {
      await extract({
        file: tgzFilePath,
        cwd: cacheDirectory,
      });
    } catch (err) {
      throw new Error(`Error extracting tar.gz file - ${err}`);
    }
  }

  private async uploadFile(hash: string, tgzFilePath: string): Promise<void> {
    const tgzFileName = this.getTgzFileName(hash);
    try {
      await this.gcsClient.upload(tgzFilePath, { destination: this.getGcsKey(tgzFileName) });
    } catch (err) {
      throw new Error(`Storage Cache: Upload error - ${err}`);
    }
  }

  private getGcsKey(tgzFileName: string) {
    return join(this.path, tgzFileName);
  }

  private async downloadFile(hash: string, tgzFilePath: string): Promise<void> {
    const tgzFileName = this.getTgzFileName(hash);

    const file = this.gcsClient.file(this.getGcsKey(tgzFileName));

    try {
      const [exists] = await file.exists();
      if (!exists) return;
    } catch (err) {
      this.logger.warn(
        'Failed to check if the file already exist in the Google Cloud Storage bucket (error below). Ignoring.',
      );
      return;
    }

    try {
      await file.download({ destination: tgzFilePath });
    } catch (err) {
      throw new Error(`Storage Cache: Download error - ${err}`);
    }
  }

  private async checkIfCacheExists(hash: string): Promise<boolean> {
    const tgzFileName = this.getTgzFileName(hash);

    try {
      const file = this.gcsClient.file(this.getGcsKey(tgzFileName));
      const [exists] = await file.exists();
      if (!exists) return false;

      return true;
    } catch (err) {
      throw new Error(`Error checking cache file existence - ${err}`);
    }
  }

  private async createCommitFile(hash: string, cacheDirectory: string): Promise<void> {
    const writeFileAsync = promisify(writeFile);

    await writeFileAsync(join(cacheDirectory, this.getCommitFileName(hash)), 'true');
  }

  private getTgzFileName(hash: string): string {
    return `${hash}.tar.gz`;
  }

  private getTgzFilePath(hash: string, cacheDirectory: string): string {
    return join(cacheDirectory, this.getTgzFileName(hash));
  }

  private getCommitFileName(hash: string): string {
    return `${hash}.commit`;
  }
}
