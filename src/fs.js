import fs from 'fs'
import util from 'util'

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)
const readDir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)
const directoryExists = async (path) => {
  try {
    const stats = await stat(path)
    return stats.isDirectory()
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false
    }
    throw err
  }
}

export {
  readFile,
  writeFile,
  readDir,
  directoryExists,
}
