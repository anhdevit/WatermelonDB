#!/usr/bin/env node

// inspired by `np` – https://github.com/sindresorhus/np

const Listr = require('listr')
const inquirer = require('inquirer')

const { execSync } = require('child_process')

const emulators = execSync(`$ANDROID_HOME/emulator/emulator -list-avds`).toString()

const askForEmu = [
  {
    type: 'list',
    name: 'name',
    message: 'Pick Emulator from list or add a new one',
    choices: emulators
      .split('\n')
      .filter(value => value.length > 0)
      .map(emu => ({
        name: emu,
        value: emu,
      }))
      .concat([
        new inquirer.Separator(),
        {
          name: 'New Emu',
          value: null,
        },
        new inquirer.Separator(),
      ]),
  },
  {
    type: 'input',
    name: 'sdk',
    when: answers => !answers.name,
    message: 'Sdk Version (21-28):',
    validate: input => input > 20 && input < 29,
  },
  {
    type: 'input',
    name: 'name',
    when: answers => !answers.name,
    message: 'Name:',
  },
]

const openEmu = options => {
  const { name, sdk } = options
  if (sdk !== undefined) {
    return [
      {
        title: 'Downloading Emulator Image',
        task: () => {
          console.log('Downloading Emulator Image\nIt may take a while')
          execSync('touch ~/.android/repositories.cfg')
          execSync('export JAVA_OPTS="-XX:+IgnoreUnrecognizedVMOptions --add-modules java.se.ee"')
          execSync(
            `$ANDROID_HOME/tools/bin/sdkmanager "system-images;android-${sdk.replace(
              /\s/g,
              '',
            )};google_apis;x86"`,
          )
        },
      },
      {
        title: `Creating Emulator ${name}`,
        task: () => {
          execSync(
            `echo no | $ANDROID_HOME/tools/bin/avdmanager create avd -n ${name.replace(
              /\s/g,
              '',
            )} -k "system-images;android-${sdk.replace(
              /\s/g,
              '',
            )};google_apis;x86" --device "Nexus 6P"`,
          )
        },
      },
    ]
  }
  return [
    {
      title: 'Open Emulator',
      task: () => execSync(`$ANDROID_HOME/emulator/emulator @${name}`),
    },
  ]
}
inquirer.prompt(askForEmu).then(options => {
  const tasks = openEmu(options)
  const listr = new Listr(tasks)
  listr.run()
})
