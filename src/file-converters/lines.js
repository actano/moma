import { readFile, writeFile } from '../fs'

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

async function readLines(filePath, getDefaultContent) {
  const content = await tryRead(filePath, getDefaultContent)
  if (content.length === 0) {
    return []
  }
  return content.trim().split('\n')
}

async function writeLines(filePath, lines) {
  const content = lines.join('\n')
  await writeFile(filePath, `${content}\n`)
}

export {
  readLines,
  writeLines,
}
