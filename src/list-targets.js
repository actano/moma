import path from 'path'

import { getAssetPath } from './assets'
import { readDir } from './fs'

const getTargetPath = () => path.join(getAssetPath(), 'targets')

async function listTargets() {
  const targetPath = getTargetPath()
  const directoryEntries = await readDir(targetPath)
  const targets = directoryEntries.map(entry => entry.replace('.yml', ''))

  console.log('Available targets:')
  targets.forEach((target) => {
    console.log(`  - ${target}`)
  })
}

export default listTargets
