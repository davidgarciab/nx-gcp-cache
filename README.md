# nx-gcp-cache


A tool for using GCP Cloud Storage (GCS) as a distributed computational cache for Nx.

## Setup

Install the package by running:

```bash
yarn add nx-gcp-cache
npm i nx-gcp-cache
```

Then run the init schematic by running:

```bash
yarn nx generate nx-gcp-cache:init
npm run nx generate nx-gcp-cache:init
```

This will make the necessary changes to nx.json in your workspace to use nx-gcp-cache runner.

## Plugin settings

There are two ways to set-up plugin options, using `nx.json` or `Environment variables`. Here is a list of all possible options:

| Parameter         | Description                                                                                         | Environment variable / .env     | `nx.json`            | Example                        |
| ----------------- | --------------------------------------------------------------------------------------------------- | ------------------------------- | -------------------- | ------------------------------ |
| Bucket            | Bucket name where cache files are stored or retrieved (can contain sub-paths as well).              | `NXCACHE_GCP_BUCKET`            | `gcpBucket`          | bucket-name/sub-path           |

> **Important:** `Environment variables` take precedence over `nx.json` options!

### `nx.json` example

```json
{
  "tasksRunnerOptions": {
  "default": {
    "runner": "nx-gcp-cache",
    "options": {
      ...
      "gcpBucket": "bucket-name/sub-path"
    }
  }
}
```

> Environment variables can be set using `.env` file - check [dotenv documentation](https://www.npmjs.com/package/dotenv).

## Disabling GCS cache

Remote cache can be disabled in favor of local cache using an environment variable

```bash
NXCACHE_GCP_DISABLE=true
```

## Authentication

> **Important:** Only ADP authentication is supported right now

### Default

GCP authentication can be set-up using Application Default Credentials (ADP), based on [GCP ADP documentation](https://cloud.google.com/docs/authentication/provide-credentials-adc).

### SSO login

To authenticate with SSO via Google Cloud CLI run
`gcloud auth application-default login`

## Build

Run `yarn build nx-gcp-cache` to build the plugin. The build artifacts will be stored in the `lib/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `yarn test nx-gcp-cache` to execute the unit tests via [Jest](https://jestjs.io).


## Credits

This repository is based on a similar AWS NX plugin using S3 [@nx-aws-plugin/nx-aws-cache](https://github.com/bojanbass/nx-aws)
