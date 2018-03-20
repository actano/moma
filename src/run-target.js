import yaml from 'js-yaml'
import chalk from 'chalk'
import Bluebird from 'bluebird'
import mapValues from 'lodash/mapValues'
import omitBy from 'lodash/omitBy'
import has from 'lodash/has'

import providers from './providers'
import { readAsset } from './assets'

function printInfo(id, info) {
  console.log(`${chalk.cyan(`[${id}]`)} ${chalk.green(info)}`)
}

async function readTargetYaml(targetId) {
  try {
    const targetYamlPath = `targets/${targetId}.yml`
    return await readAsset(targetYamlPath)
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Unknown target '${targetId}'`)
    }
    throw err
  }
}

async function runTarget(targetId) {
  const content = await readTargetYaml(targetId)
  const target = yaml.safeLoad(content)

  printInfo(targetId, 'Starting...')

  const providersToRun = {}

  for (const id of Object.keys(providers)) {
    const providerConfig = has(target, id) ? target[id] || {} : null
    if (providerConfig) {
      const Provider = providers[id]
      providersToRun[id] = new Provider(targetId, providerConfig)
    }
  }

  const providerResults = await Bluebird.props(
    mapValues(providersToRun, provider => provider.run()),
  )
  const providerSummaries = omitBy(providerResults, result => result == null)
  const summaries = []

  if (target.info) {
    summaries.push(target.info.trim())
  }

  printInfo(targetId, 'Done')

  return {
    summaries,
    providerSummaries,
  }
}

export default runTarget
