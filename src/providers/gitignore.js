import difference from 'lodash/difference'

import Provider from './base'
import { readFile, writeFile } from '../fs'

const GITIGNORE = '.gitignore'

async function readGitignore() {
  try {
    const content = await readFile(GITIGNORE, { encoding: 'utf8' })
    return content.trim().split('\n')
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }

    return []
  }
}

async function writeGitignore(gitignore) {
  const content = `${gitignore.join('\n')}\n`
  await writeFile(GITIGNORE, content)
}

class GitignoreProvider extends Provider {
  constructor(targetId, config) {
    super(GitignoreProvider.id, targetId, config)
  }

  async run() {
    const gitignore = await readGitignore()
    const updatedGitignore = this.addMissingEntries(gitignore)
    await writeGitignore(updatedGitignore)
  }

  addMissingEntries(gitignore) {
    const newEntries = difference(this.config, gitignore)
    return [
      ...gitignore,
      ...newEntries,
    ]
  }
}

GitignoreProvider.id = 'gitignore'

export default GitignoreProvider
