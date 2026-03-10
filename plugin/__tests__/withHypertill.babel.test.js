const withHypertill = require('../withHypertill')

const { ensureDecoratorsBabelPlugins, getRequiredBabelPluginEntries } = withHypertill._internal

describe('withHypertill Babel auto config', () => {
  it('adds required Babel plugins in the right order and keeps existing plugins', () => {
    const input = `module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      'react-native-reanimated/plugin',
    ],
  }
}
`

    const output = ensureDecoratorsBabelPlugins(input)
    const requiredEntries = getRequiredBabelPluginEntries()

    requiredEntries.forEach((entry) => {
      expect(output).toContain(entry)
    })
    expect(output).toContain("'react-native-reanimated/plugin'")
    expect(output).toContain('overrides: [')
    expect(output).toContain('filename.startsWith(__dirname)')

    const decoratorsIndex = output.indexOf(requiredEntries[0])
    const flowStripIndex = output.indexOf(requiredEntries[1])
    const classPropertiesIndex = output.indexOf(requiredEntries[2])
    const privateMethodsIndex = output.indexOf(requiredEntries[3])
    const privateInObjectIndex = output.indexOf(requiredEntries[4])

    expect(decoratorsIndex).toBeLessThan(flowStripIndex)
    expect(flowStripIndex).toBeLessThan(classPropertiesIndex)
    expect(classPropertiesIndex).toBeLessThan(privateMethodsIndex)
    expect(privateMethodsIndex).toBeLessThan(privateInObjectIndex)
  })

  it('is idempotent when run multiple times', () => {
    const input = `module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
    plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
  }
}
`

    const firstPass = ensureDecoratorsBabelPlugins(input)
    const secondPass = ensureDecoratorsBabelPlugins(firstPass)
    expect(secondPass).toBe(firstPass)
  })

  it('injects overrides property when it does not exist', () => {
    const input = `module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
  }
}
`

    const output = ensureDecoratorsBabelPlugins(input)
    const requiredEntries = getRequiredBabelPluginEntries()

    expect(output).toContain('overrides: [')
    requiredEntries.forEach((entry) => {
      expect(output).toContain(entry)
    })
  })

  it('can inject overrides into object-style module exports', () => {
    const input = `module.exports = {
  presets: ['babel-preset-expo'],
}
`
    const output = ensureDecoratorsBabelPlugins(input)
    const requiredEntries = getRequiredBabelPluginEntries()

    expect(output).toContain('overrides: [')
    requiredEntries.forEach((entry) => {
      expect(output).toContain(entry)
    })
  })
})
