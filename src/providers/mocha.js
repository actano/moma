import difference from 'lodash/difference'
import chalk from 'chalk'

import Provider from './base'
import { readLines, writeLines } from '../file-converters/lines'
import { directoryExists } from '../fs'

const MOCHA_OPTS = 'test/mocha.opts'

class MochaProvider extends Provider {
  constructor(targetId, config) {
    super(MochaProvider.id, targetId, config)
  }

  async run() {
    await this.updateOpts()
  }

  async updateOpts() {
    if (!await directoryExists('test')) {
      console.log(chalk.yellow('No test directory found. Skipping mocha.opts'))
      return
    }
    const opts = await readLines(MOCHA_OPTS, async () => '')
    const missingOpts = difference(this.config.opts || [], opts)
    const updatedOpts = [
      ...opts,
      ...missingOpts,
    ]
    await writeLines(MOCHA_OPTS, updatedOpts)
  }
}

MochaProvider.id = 'mocha'

export default MochaProvider
