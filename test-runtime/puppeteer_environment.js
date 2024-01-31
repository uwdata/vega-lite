import {readFile} from 'fs/promises';
import os from 'os';
import path from 'path';
import {connect} from 'puppeteer';
import NodeEnvironment from 'jest-environment-node';

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

export default class PuppeteerEnvironment extends NodeEnvironment.TestEnvironment {
  constructor(config) {
    super(config);
  }

  async setup() {
    await super.setup();
    // get the wsEndpoint
    const wsEndpoint = await readFile(path.join(DIR, 'wsEndpoint'), 'utf8');
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found');
    }

    // connect to puppeteer
    this.global.__BROWSER_GLOBAL__ = await connect({
      browserWSEndpoint: wsEndpoint
    });
  }

  async teardown() {
    if (this.global.__BROWSER_GLOBAL__) {
      this.global.__BROWSER_GLOBAL__.disconnect();
    }
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}
