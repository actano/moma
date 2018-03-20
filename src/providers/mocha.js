import difference from 'lodash/difference'

import Provider from './base'
import { readLines, writeLines } from '../file-converters/lines'

const MOCHA_OPTS = 'test/mocha.opts'

class MochaProvider extends Provider {
  constructor(targetId, config) {
    super(MochaProvider.id, targetId, config)
  }

  async run() {
    const opts = await readLines(MOCHA_OPTS, async () => '')
    const updatedOpts = this.updateOpts(opts)
    await writeLines(MOCHA_OPTS, updatedOpts)
  }

  updateOpts(opts) {
    const missingOpts = difference(this.config.opts || [], opts)
    return [
      ...opts,
      ...missingOpts,
    ]
  }
}

MochaProvider.id = 'mocha'

export default MochaProvider
