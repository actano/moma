import path from 'path'
import { readFile } from './fs'

const getAssetPath = () => path.resolve(path.join(__dirname, '../assets'))

async function readAsset(assetPath) {
  const absoluteAssetPath = path.join(getAssetPath(), assetPath)
  return await readFile(absoluteAssetPath, { encoding: 'utf8' })
}

export {
  readAsset,
  getAssetPath,
}
