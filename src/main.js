#!/usr/bin/env node

import program from 'commander'
import chalk from 'chalk'
import forEach from 'lodash/forEach'

import runTarget from './run-target'
import listTargets from './list-targets'

// eslint-disable-next-line consistent-return
const handleErrors = fn => async (...args) => {
  try {
    return await fn(...args)
  } catch (err) {
    console.log(chalk.red(err.stack))
    process.exit(1)
  }
}

function printSummary(targetSummary) {
  console.log(chalk.yellow('\nSummary:'))
  console.log(chalk.yellow('========'))

  forEach(targetSummary, ({ summaries, providerSummaries }, targetId) => {
    summaries.forEach((summary) => {
      console.log(`${chalk.cyan(`[${targetId}]`)} ${chalk.green(summary)}`)
    })
    forEach(providerSummaries, (summary, providerId) => {
      console.log(`${chalk.cyan(`[${targetId}:${providerId}]`)} ${chalk.green(summary)}`)
    })
  })
}

async function runTargets(targets) {
  const targetSummary = {}

  for (const target of targets) {
    // eslint-disable-next-line no-await-in-loop
    const { summaries, providerSummaries } = await runTarget(target)

    if (summaries.length > 0 || Object.keys(providerSummaries).length > 0) {
      targetSummary[target] = { summaries, providerSummaries }
    }
  }

  if (Object.keys(targetSummary).length > 0) {
    printSummary(targetSummary)
  }
}

program
  .command('add <targets...>')
  .action(handleErrors(runTargets))

program
  .command('init')
  .action(handleErrors(async () => {
    await runTargets(['base'])
  }))

program
  .command('ls')
  .action(handleErrors(listTargets))

program.parse(process.argv)
