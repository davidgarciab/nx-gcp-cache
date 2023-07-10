import { output } from '@nx/devkit';
import * as chalk from 'chalk';

export class Logger {
  public debug(message: string): void {
    if (!process.env['NXCACHE_VERBOSE_LOGGING']) {
      return;
    }

    output.addNewline();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output as any).writeOutputTitle({
      label: chalk.reset.inverse.bold.keyword('grey')(' GCP-CLOUD '),
      title: chalk.keyword('grey')(message),
    });
    output.addNewline();
  }

  public error(message: string): void {
    output.addNewline();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output as any).writeOutputTitle({
      label: chalk.reset.inverse.bold.red(' GCP-CLOUD '),
      title: chalk.bold.red(message),
    });
    output.addNewline();
  }

  public warn(message: string): void {
    output.addNewline();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output as any).writeOutputTitle({
      label: chalk.reset.inverse.bold.yellow(' GCP-CLOUD '),
      title: chalk.bold.yellow(message),
    });
    output.addNewline();
  }

  public success(message: string): void {
    output.addNewline();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output as any).writeOutputTitle({
      label: chalk.reset.inverse.bold.green(' GCP-CLOUD '),
      title: chalk.bold.green(message),
    });
    output.addNewline();
  }

  public note(message: string): void {
    output.addNewline();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (output as any).writeOutputTitle({
      label: chalk.reset.inverse.bold.keyword('orange')(' GCP-CLOUD '),
      title: chalk.keyword('orange')(message),
    });
    output.addNewline();
  }
}
