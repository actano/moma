import flow from 'lodash/flow'
import set from 'lodash/fp/set'
import omit from 'lodash/omit'

import Provider from './base'
import { readJson, writeJson } from '../file-converters/json'
import toArray from '../util/to-array'

const BABEL_RC = '.babelrc'

async function getDefaultContent() {
  return '{}'
}

function denormalizePlugin(plugin) {
  if (Array.isArray(plugin)) {
    return plugin
  }

  return [plugin, {}]
}

function normalizePlugin(plugin) {
  if (Object.keys(plugin[1]).length === 0) {
    return plugin[0]
  }

  return plugin
}

function denormalizeBabelRc(babelRc) {
  const plugins = toArray(babelRc.data.plugins || [])
  const presets = toArray(babelRc.data.presets || [])

  return flow(
    set('data.plugins', plugins.map(denormalizePlugin)),
    set('data.presets', presets.map(denormalizePlugin)),
  )(babelRc)
}

function normalizeBabelRc(babelRc) {
  const normalizedData = omit(babelRc.data, ['plugins', 'presets'])

  if (babelRc.data.plugins.length > 0) {
    normalizedData.plugins = babelRc.data.plugins.map(normalizePlugin)
  }

  if (babelRc.data.presets.length > 0) {
    normalizedData.presets = babelRc.data.presets.map(normalizePlugin)
  }

  return {
    ...babelRc,
    data: normalizedData,
  }
}

async function readBabelRc() {
  return denormalizeBabelRc(await readJson(BABEL_RC, getDefaultContent))
}

async function writeBabelRc(babelRc) {
  await writeJson(BABEL_RC, normalizeBabelRc(babelRc))
}

function hasPlugin(plugins, pluginId) {
  return plugins.find(plugin => plugin[0] === pluginId) != null
}

class BabelProvider extends Provider {
  constructor(targetId, config) {
    super(BabelProvider.id, targetId, config)
  }

  async run() {
    const babelRc = await readBabelRc()
    const updatedBabelRc = this.updateBabelRc(babelRc)
    await writeBabelRc(updatedBabelRc)
  }

  updateBabelRc(babelRc) {
    const updatedBabelRc = {
      ...babelRc,
    }

    if (this.config.plugins) {
      updatedBabelRc.data.plugins = this.addPlugins(this.config.plugins, babelRc.data.plugins)
    }

    if (this.config.presets) {
      updatedBabelRc.data.presets = this.addPlugins(this.config.presets, babelRc.data.presets)
    }

    return updatedBabelRc
  }

  addPlugins(newPlugins, plugins) {
    const _newPlugins = newPlugins.map(denormalizePlugin)

    return _newPlugins.reduce(
      (acc, plugin) => {
        const pluginId = plugin[0]
        if (hasPlugin(acc, pluginId)) {
          this.warn(`Unable to add '${pluginId}', it already exists`)
          return acc
        }

        return [
          ...acc,
          plugin,
        ]
      },
      plugins,
    )
  }
}

BabelProvider.id = 'babel'

export default BabelProvider
