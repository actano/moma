import detectIndent from 'detect-indent'
import yaml from 'js-yaml'

import { readFile, writeFile } from '../fs'

const DEFAULT_INDENT = 2

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

async function readYaml(filePath, getDefaultContent) {
  const content = await tryRead(filePath, getDefaultContent)
  const detectedIndent = detectIndent(content).indent
  const indent = detectedIndent ? detectedIndent.length : DEFAULT_INDENT
  const data = yaml.safeLoad(content, { filename: filePath })

  return {
    data,
    indent,
  }
}

async function writeYaml(filePath, yamlData) {
  const content = yaml.safeDump(yamlData.data, { indent: yamlData.indent })
  await writeFile(filePath, content)
}

export {
  readYaml,
  writeYaml,
}
