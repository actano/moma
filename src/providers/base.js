import chalk from 'chalk'

class Provider {
  constructor(id, targetId, config) {
    this.id = id
    this.targetId = targetId
    this.config = config
  }

  log(s) {
    console.log(`${chalk.cyan(`[${this.targetId}:${this.id}]`)} ${chalk.green(s)}`)
  }

  warn(s) {
    console.log(`${chalk.cyan(`[${this.targetId}:${this.id}]`)} ${chalk.yellow(s)}`)
  }
}

export default Provider
