import detectIndent from 'detect-indent'
import yaml from 'js-yaml'
import jsonpatch from 'fast-json-patch'
import reduce from 'lodash/fp/reduce'
import flatMap from 'lodash/flatMap'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import difference from 'lodash/difference'

import Provider from './base'
import { readFile, writeFile } from '../fs'
import { readAsset } from '../assets'
import toArray from '../util/to-array'

const DEFAULT_INDENT = 2
const TRAVIS_BASE_YAML = 'travis.base.yml'
const TRAVIS_YAML = '.travis.yml'

const LIFECYCLE_KEYS = [
  'before_install',
  'install',
  'before_script',
  'script',
  'after_success',
  'after_failure',
  'before_deploy',
  'deploy',
  'after_deploy',
  'after_script',
]

const ARRAY_KEYS = new Set([
  'node_js',
  ...LIFECYCLE_KEYS,
])

const TRAVIS_YAML_CREATION_INFO = `A new ${TRAVIS_YAML} has been created. Please add a npm auth token via
  travis encrypt YOUR_AUTH_TOKEN --add deploy.api_key
See https://docs.travis-ci.com/user/deployment/npm/#NPM-auth-token for reference.`

const updateKeyOp = travisYaml => (value, key) => {
  if (ARRAY_KEYS.has(key)) {
    const valueArray = toArray(value)
    const valuesToAdd = difference(valueArray, travisYaml.data[key])
    return valuesToAdd.map(v => ({
      op: 'add',
      path: `/data/${key}/-`,
      value: v,
    }))
  }

  return [
    {
      op: 'add',
      path: `/data/${key}`,
      value,
    },
  ]
}

function updateArrayKeys(travisYaml, fn) {
  const updatedData = reduce(
    fn,
    travisYaml.data,
    Array.from(ARRAY_KEYS.values()),
  )

  return {
    ...travisYaml,
    data: updatedData,
  }
}

function denormalizeArrayKeys(travisYaml) {
  return updateArrayKeys(
    travisYaml,
    (acc, key) => ({
      ...acc,
      [key]: toArray(acc[key] || []),
    }),
  )
}

function normalizeArrayKeys(travisYaml) {
  return updateArrayKeys(
    travisYaml,
    (acc, key) => {
      if (acc[key].length === 1) {
        return {
          ...acc,
          [key]: acc[key][0],
        }
      }
      if (acc[key].length === 0) {
        return omit(acc, key)
      }
      return acc
    },
  )
}

function sortLifecycleKeys(travisYaml) {
  const nonLifecycleData = omit(travisYaml.data, LIFECYCLE_KEYS)
  const lifecycleData = pick(travisYaml.data, LIFECYCLE_KEYS)
  return {
    ...travisYaml,
    data: {
      ...nonLifecycleData,
      ...lifecycleData,
    },
  }
}

async function writeTravisYaml(travisYaml) {
  const normalizedTravisYaml = normalizeArrayKeys(travisYaml)
  const content = yaml.safeDump(normalizedTravisYaml.data, { indent: normalizedTravisYaml.indent })
  await writeFile(TRAVIS_YAML, content)
}

class TravisProvider extends Provider {
  constructor(targetId, config) {
    super(TravisProvider.id, targetId, config)
  }

  async run() {
    const travisYaml = await this.readTravisYaml()
    const updatedTravisYaml = sortLifecycleKeys(this.updateTravisYaml(travisYaml))
    await writeTravisYaml(updatedTravisYaml)

    if (this._createdTravisYaml) {
      return TRAVIS_YAML_CREATION_INFO
    }

    return null
  }

  updateTravisYaml(travisYaml) {
    const ops = flatMap(this.config, updateKeyOp(travisYaml))
    return ops.reduce(jsonpatch.applyReducer, travisYaml)
  }

  async getTravisYamlContent() {
    try {
      return await readFile(TRAVIS_YAML, { encoding: 'utf8' })
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }

      this._createdTravisYaml = true
      return await readAsset(TRAVIS_BASE_YAML)
    }
  }

  async readTravisYaml() {
    const content = await this.getTravisYamlContent()
    const detectedIndent = detectIndent(content).indent
    const indent = detectedIndent ? detectedIndent.length : DEFAULT_INDENT
    const data = yaml.safeLoad(content, { filename: TRAVIS_YAML })

    return denormalizeArrayKeys({
      data,
      indent,
    })
  }
}

TravisProvider.id = 'travis'

export default TravisProvider
