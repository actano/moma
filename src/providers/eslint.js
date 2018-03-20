import Provider from './base'
import { readYaml, writeYaml } from '../file-converters/yaml'

const ESLINT_YAML = '.eslintrc.yml'

class EslintProvider extends Provider {
  constructor(targetId, config) {
    super(EslintProvider.id, targetId, config)
  }

  async run() {
    const yaml = await readYaml(ESLINT_YAML, async () => '')
    const updatedYaml = {
      ...yaml,
      data: {
        ...yaml.data,
        ...this.config,
      },
    }
    await writeYaml(ESLINT_YAML, updatedYaml)
  }
}

EslintProvider.id = 'eslint'

export default EslintProvider
