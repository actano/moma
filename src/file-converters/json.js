import detectIndent from 'detect-indent'
import { readFile, writeFile } from '../fs'

const DEFAULT_INDENT = '  '

async function tryRead(filePath, getDefaultContent) {
  try {
    return await readFile(filePath, { encoding: 'utf8' })
  } catch (err) {
    if (err.code !== 'ENOENT' || typeof getDefaultContent !== 'function') {
      throw err
    }

    return await getDefaultContent()
  }
}

async function readJson(filePath, getDefaultContent) {
  const content = await tryRead(filePath, getDefaultContent)
  const indent = detectIndent(content).indent || DEFAULT_INDENT
  const data = JSON.parse(content)
  return {
    data,
    indent,
  }
}

async function writeJson(filePath, json) {
  const content = JSON.stringify(json.data, null, json.indent)
  await writeFile(filePath, `${content}\n`)
}

export {
  readJson,
  writeJson,
}
