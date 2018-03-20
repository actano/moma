import assert from 'assert'
import { spawn as _spawn } from 'child_process'
import set from 'lodash/fp/set'
import reduce from 'lodash/reduce'

import Provider from './base'
import { readJson, writeJson } from '../file-converters/json'

const PACKAGE_JSON = 'package.json'

const WILDCARD_SCRIPTS = new Set([
  'build',
  'clean',
])

const isWildcardScript = script => WILDCARD_SCRIPTS.has(script.split(':')[0])

function addToWildcard(scripts, key) {
  const wildcard = key.split(':')[0]
  assert(WILDCARD_SCRIPTS.has(wildcard), `Unknown wildcard ${wildcard}`)

  const wildcardScript = scripts[wildcard] || ''
  const currentScripts = new Set(
    wildcardScript.length > 0
      ? wildcardScript
        .split('&&')
        .map(script =>
          script
            .replace('npm run', '')
            .trim())
      : [],
  )

  currentScripts.add(key)

  const updatedWildcardScript = Array.from(currentScripts)
    .map(script => `npm run ${script}`)
    .join(' && ')

  return {
    ...scripts,
    [wildcard]: updatedWildcardScript,
  }
}

const spawn = (...args) =>
  new Promise((resolve, reject) => {
    const process = _spawn(...args)
    process.on('error', reject)
    process.on('exit', (code) => {
      resolve(code)
    })
  })

function sortObject(obj) {
  const sortedObj = {}

  for (const key of Object.keys(obj).sort()) {
    sortedObj[key] = obj[key]
  }

  return sortedObj
}

class PackageJsonProvider extends Provider {
  constructor(targetId, config) {
    super(PackageJsonProvider.id, targetId, config)
  }

  async run() {
    if (this.config.devDependencies) {
      await this.yarnAdd(this.config.devDependencies, true)
    }

    if (this.config.dependencies) {
      await this.yarnAdd(this.config.dependencies, false)
    }

    if (this.config.scripts) {
      await this.addScriptsToPackageJson(this.config.scripts)
    }
  }

  async addScriptsToPackageJson(scripts) {
    const packageJson = await readJson(PACKAGE_JSON)
    const updatedPackageJson = await this.addScripts(packageJson, scripts)
    await writeJson(PACKAGE_JSON, updatedPackageJson)
  }

  async addScripts(packageJson, scripts) {
    this.log(`adding scripts to package.json: ${Object.keys(scripts).join(', ')}`)

    const currentScripts = packageJson.data.scripts || {}
    const updatedScripts = reduce(
      scripts,
      (acc, script, key) => {
        let updated = {
          ...acc,
          [key]: script,
        }

        if (isWildcardScript(key)) {
          updated = addToWildcard(updated, key)
        }

        return updated
      },
      currentScripts,
    )
    const sortedScripts = sortObject(updatedScripts)

    return set('data.scripts', sortedScripts, packageJson)
  }

  async yarnAdd(deps, dev) {
    this.log(`adding ${dev ? 'dev ' : ''}dependencies: ${deps.join(', ')}`)
    const args = ['add']

    if (dev) {
      args.push('-D')
    }

    args.push(...deps)

    await spawn('yarn', args, { stdio: 'inherit' })
  }
}

PackageJsonProvider.id = 'package.json'

export default PackageJsonProvider
