import path from 'path'
import { readFile } from './fs'

async function readAsset(assetPath) {
  const absoluteAssetPath = path.resolve(path.join(__dirname, '../assets', assetPath))
  return await readFile(absoluteAssetPath, { encoding: 'utf8' })
}

export { readAsset }
