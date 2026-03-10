const { withAppBuildGradle, withDangerousMod, withMainApplication, withSettingsGradle } = require('@expo/config-plugins')
const fs = require('fs/promises')

const REQUIRED_BABEL_PLUGIN_IDS = [
  '@babel/plugin-proposal-decorators',
  '@babel/plugin-transform-flow-strip-types',
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-transform-class-properties',
  '@babel/plugin-proposal-private-methods',
  '@babel/plugin-transform-private-methods',
  '@babel/plugin-proposal-private-property-in-object',
  '@babel/plugin-transform-private-property-in-object',
]

const CLASS_PROPERTIES_PLUGIN_IDS = [
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-transform-class-properties',
]

const PRIVATE_METHODS_PLUGIN_IDS = [
  '@babel/plugin-proposal-private-methods',
  '@babel/plugin-transform-private-methods',
]

const PRIVATE_PROPERTY_IN_OBJECT_PLUGIN_IDS = [
  '@babel/plugin-proposal-private-property-in-object',
  '@babel/plugin-transform-private-property-in-object',
]

const BABEL_CONFIG_FILE_NAMES = ['babel.config.js', 'babel.config.cjs']

const resolveFromHypertillPackage = (pluginName) =>
  `require.resolve('${pluginName}', { paths: [require.resolve('@hypertill/db/package.json')] })`

const REQUIRED_BABEL_PLUGIN_GROUPS = [
  {
    key: 'decorators',
    ids: ['@babel/plugin-proposal-decorators'],
    entry: `[${resolveFromHypertillPackage('@babel/plugin-proposal-decorators')}, { legacy: true }]`,
  },
  {
    key: 'flow-strip-types',
    ids: ['@babel/plugin-transform-flow-strip-types'],
    entry: `[${resolveFromHypertillPackage('@babel/plugin-transform-flow-strip-types')}]`,
  },
  {
    key: 'class-properties',
    ids: CLASS_PROPERTIES_PLUGIN_IDS,
    entry: `[${resolveFromHypertillPackage('@babel/plugin-transform-class-properties')}, { loose: true }]`,
  },
  {
    key: 'private-methods',
    ids: PRIVATE_METHODS_PLUGIN_IDS,
    entry: `[${resolveFromHypertillPackage('@babel/plugin-transform-private-methods')}, { loose: true }]`,
  },
  {
    key: 'private-property-in-object',
    ids: PRIVATE_PROPERTY_IN_OBJECT_PLUGIN_IDS,
    entry: `[${resolveFromHypertillPackage('@babel/plugin-transform-private-property-in-object')}, { loose: true }]`,
  },
]

function getRequiredBabelPluginEntries() {
  return REQUIRED_BABEL_PLUGIN_GROUPS.map((group) => group.entry)
}

function isEscaped(contents, index) {
  let slashCount = 0
  for (let i = index - 1; i >= 0 && contents[i] === '\\'; i -= 1) {
    slashCount += 1
  }
  return slashCount % 2 === 1
}

function findMatchingBracket(contents, openingIndex, openingChar, closingChar) {
  let depth = 0
  let quote = null
  let lineComment = false
  let blockComment = false

  for (let i = openingIndex; i < contents.length; i += 1) {
    const current = contents[i]
    const next = contents[i + 1]

    if (lineComment) {
      if (current === '\n') {
        lineComment = false
      }
      continue
    }

    if (blockComment) {
      if (current === '*' && next === '/') {
        blockComment = false
        i += 1
      }
      continue
    }

    if (quote) {
      if (current === quote && !isEscaped(contents, i)) {
        quote = null
      }
      continue
    }

    if (current === '/' && next === '/') {
      lineComment = true
      i += 1
      continue
    }

    if (current === '/' && next === '*') {
      blockComment = true
      i += 1
      continue
    }

    if (current === "'" || current === '"' || current === '`') {
      quote = current
      continue
    }

    if (current === openingChar) {
      depth += 1
    } else if (current === closingChar) {
      depth -= 1
      if (depth === 0) {
        return i
      }
    }
  }

  return -1
}

function splitTopLevelArrayEntries(arrayContents) {
  const entries = []
  let depthCurly = 0
  let depthSquare = 0
  let depthParen = 0
  let quote = null
  let lineComment = false
  let blockComment = false
  let startIndex = 0

  for (let i = 0; i < arrayContents.length; i += 1) {
    const current = arrayContents[i]
    const next = arrayContents[i + 1]

    if (lineComment) {
      if (current === '\n') {
        lineComment = false
      }
      continue
    }

    if (blockComment) {
      if (current === '*' && next === '/') {
        blockComment = false
        i += 1
      }
      continue
    }

    if (quote) {
      if (current === quote && !isEscaped(arrayContents, i)) {
        quote = null
      }
      continue
    }

    if (current === '/' && next === '/') {
      lineComment = true
      i += 1
      continue
    }

    if (current === '/' && next === '*') {
      blockComment = true
      i += 1
      continue
    }

    if (current === "'" || current === '"' || current === '`') {
      quote = current
      continue
    }

    if (current === '{') {
      depthCurly += 1
      continue
    }
    if (current === '}') {
      depthCurly -= 1
      continue
    }
    if (current === '[') {
      depthSquare += 1
      continue
    }
    if (current === ']') {
      depthSquare -= 1
      continue
    }
    if (current === '(') {
      depthParen += 1
      continue
    }
    if (current === ')') {
      depthParen -= 1
      continue
    }

    if (current === ',' && depthCurly === 0 && depthSquare === 0 && depthParen === 0) {
      entries.push(arrayContents.slice(startIndex, i).trim())
      startIndex = i + 1
    }
  }

  const lastEntry = arrayContents.slice(startIndex).trim()
  if (lastEntry) {
    entries.push(lastEntry)
  }

  return entries.filter(Boolean)
}

function findRequiredPluginGroup(entry) {
  return REQUIRED_BABEL_PLUGIN_GROUPS.find((group) =>
    group.ids.some((pluginId) => entry.includes(pluginId)),
  )
}

function resolveGroupEntry(group, existingEntry) {
  if (
    group.key === 'class-properties' &&
    existingEntry &&
    existingEntry.includes('@babel/plugin-transform-class-properties')
  ) {
    return existingEntry
  }
  return group.entry
}

function makePluginsArrayValue(propertyIndent, entries) {
  const entryIndent = `${propertyIndent}  `
  const pluginLines = entries.map((entry) => `${entryIndent}${entry},`)
  return `plugins: [\n${pluginLines.join('\n')}\n${propertyIndent}]`
}

function makeOverrideEntry(entryIndent, requiredEntries) {
  const propertyIndent = `${entryIndent}  `
  const pluginIndent = `${propertyIndent}  `
  const overrideLines = [
    `${entryIndent}{`,
    `${propertyIndent}test: (filename) => typeof filename === 'string' && filename.startsWith(__dirname),`,
    `${propertyIndent}plugins: [`,
    ...requiredEntries.map((entry) => `${pluginIndent}${entry},`),
    `${propertyIndent}],`,
    `${entryIndent}},`,
  ]

  return overrideLines.join('\n')
}

function makeOverrideValue(propertyIndent, requiredEntries) {
  const entryIndent = `${propertyIndent}  `
  const overrideEntry = makeOverrideEntry(entryIndent, requiredEntries)
  return `overrides: [\n${overrideEntry}\n${propertyIndent}],`
}

function findPropertyMatch(contents, propertyName) {
  const regex = new RegExp(`(^[ \\t]*)${propertyName}\\s*:\\s*\\[`, 'gm')
  let match = null
  let best = null
  while ((match = regex.exec(contents))) {
    const indent = match[1].length
    if (!best || indent < best.indent) {
      best = { index: match.index, indent, match }
    }
  }
  return best
}

function ensureDecoratorsBabelPlugins(contents) {
  let nextContents = contents
  const requiredEntries = getRequiredBabelPluginEntries()

  const pluginsPropertyMatch = findPropertyMatch(contents, 'plugins')

  if (pluginsPropertyMatch) {
    const pluginsPropertyIndex = pluginsPropertyMatch.index
    const openingBracketIndex = pluginsPropertyIndex + pluginsPropertyMatch.match[0].length - 1
    const closingBracketIndex = findMatchingBracket(contents, openingBracketIndex, '[', ']')

    if (closingBracketIndex !== -1) {
      const arrayContents = contents.slice(openingBracketIndex + 1, closingBracketIndex)
      const existingEntries = splitTopLevelArrayEntries(arrayContents)

      const groupEntries = new Map()
      const remainingEntries = []

      existingEntries.forEach((entry) => {
        const group = findRequiredPluginGroup(entry)
        if (!group) {
          remainingEntries.push(entry)
          return
        }
        if (!groupEntries.has(group.key)) {
          groupEntries.set(group.key, entry)
        } else {
          remainingEntries.push(entry)
        }
      })

      const lineStartIndex = contents.lastIndexOf('\n', pluginsPropertyIndex) + 1
      const propertyIndent = contents.slice(lineStartIndex, pluginsPropertyIndex)
      const replacement = makePluginsArrayValue(propertyIndent, [...remainingEntries])

      nextContents = `${contents.slice(0, pluginsPropertyIndex)}${replacement}${contents.slice(
        closingBracketIndex + 1,
      )}`
    }
  }

  const overridesPropertyMatch = findPropertyMatch(nextContents, 'overrides')
  if (overridesPropertyMatch) {
    const overridesIndex = overridesPropertyMatch.index
    const openingBracketIndex = overridesIndex + overridesPropertyMatch.match[0].length - 1
    const closingBracketIndex = findMatchingBracket(nextContents, openingBracketIndex, '[', ']')

    if (closingBracketIndex !== -1) {
      const overridesContents = nextContents.slice(openingBracketIndex + 1, closingBracketIndex)
      const hasRequiredPlugin = REQUIRED_BABEL_PLUGIN_IDS.some((pluginId) =>
        overridesContents.includes(pluginId),
      )

      if (!hasRequiredPlugin) {
        const lineStartIndex = nextContents.lastIndexOf('\n', overridesIndex) + 1
        const propertyIndent = nextContents.slice(lineStartIndex, overridesIndex)
        const overrideEntry = makeOverrideEntry(`${propertyIndent}  `, requiredEntries)
        nextContents = `${nextContents.slice(0, openingBracketIndex + 1)}\n${overrideEntry}\n${nextContents.slice(
          openingBracketIndex + 1,
        )}`
      }
    }

    return nextContents
  }

  const overridesProperty = makeOverrideValue('    ', requiredEntries)

  if (nextContents.includes('return {')) {
    return nextContents.replace('return {', `return {\n    ${overridesProperty}`)
  }

  if (nextContents.includes('module.exports = {')) {
    return nextContents.replace('module.exports = {', `module.exports = {\n  ${overridesProperty}`)
  }

  return nextContents
}

async function ensureBabelConfig(projectRoot) {
  let babelConfigPath = null

  for (const fileName of BABEL_CONFIG_FILE_NAMES) {
    const candidatePath = path.join(projectRoot, fileName)
    try {
      await fs.access(candidatePath)
      babelConfigPath = candidatePath
      break
    } catch (_error) {
      continue
    }
  }

  if (!babelConfigPath) {
    babelConfigPath = path.join(projectRoot, 'babel.config.js')
    const requiredEntries = getRequiredBabelPluginEntries()
      .map((entry) => `      ${entry},`)
      .join('\n')
    const initialConfig = `module.exports = function (api) {
  api.cache(true)

  return {
    presets: ['babel-preset-expo'],
    plugins: [
${requiredEntries}
    ],
  }
}
`
    await fs.writeFile(babelConfigPath, initialConfig, 'utf8')
    return
  }

  const currentContents = await fs.readFile(babelConfigPath, 'utf8')
  const nextContents = ensureDecoratorsBabelPlugins(currentContents)

  if (nextContents !== currentContents) {
    await fs.writeFile(babelConfigPath, nextContents, 'utf8')
  }
}

function withBabelConfig(config, options = {}) {
  if (options.disableAutoBabelConfig === true) {
    return config
  }

  let alreadyPatched = false
  const applyPatchOnce = async (mod) => {
    if (!alreadyPatched) {
      await ensureBabelConfig(mod.modRequest.projectRoot)
      alreadyPatched = true
    }
    return mod
  }

  let currentConfig = config
  currentConfig = withDangerousMod(currentConfig, ['android', applyPatchOnce])
  currentConfig = withDangerousMod(currentConfig, ['ios', applyPatchOnce])
  return currentConfig
}

function withSettings(config) {
  return withSettingsGradle(config, (mod) => {
    if (mod.modResults.contents.includes(":watermelondb-jsi")) {
      return mod
    }

    mod.modResults.contents += `
include ':watermelondb-jsi'
project(':watermelondb-jsi').projectDir = new File([
    "node", "--print",
    "require.resolve('@hypertill/db/package.json')"
].execute(null, rootProject.projectDir).text.trim(), "../native/android-jsi")
`

    return mod
  })
}

function withBuildGradle(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes("pickFirst '**/libc++_shared.so'")) {
      mod.modResults.contents = mod.modResults.contents.replace(
        'android {',
        `
android {
  packagingOptions {
    pickFirst '**/libc++_shared.so'
  }
`,
      )
    }

    if (!mod.modResults.contents.includes("implementation project(':watermelondb-jsi')")) {
      mod.modResults.contents = mod.modResults.contents.replace(
        'dependencies {',
        `
dependencies {
  implementation project(':watermelondb-jsi')
`,
      )
    }

    return mod
  })
}

function withMainApplicationPackage(config) {
  return withMainApplication(config, (mod) => {
    if (!mod.modResults.contents.includes('import com.hypertill.db.jsi.HypertillDBJSIPackage')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        'import android.app.Application',
        `import android.app.Application
import com.hypertill.db.jsi.HypertillDBJSIPackage`,
      )
    }

    if (!mod.modResults.contents.includes('add(HypertillDBJSIPackage())')) {
      if (mod.modResults.contents.includes('PackageList(this).packages.apply')) {
        mod.modResults.contents = mod.modResults.contents.replace(
          /(\/\/ add\(MyReactNativePackage\(\)\))/,
          `$1
      add(HypertillDBJSIPackage())`,
        )
      } else if (mod.modResults.contents.includes('return packages')) {
        mod.modResults.contents = mod.modResults.contents.replace(
          'return packages',
          `packages.add(HypertillDBJSIPackage())
    return packages`,
        )
      }
    }

    return mod
  })
}

function withProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const filePath = `${mod.modRequest.platformProjectRoot}/app/proguard-rules.pro`
      const contents = await fs.readFile(filePath, 'utf8')

      if (!contents.includes('-keep class com.hypertill.db.** { *; }')) {
        await fs.writeFile(
          filePath,
          `${contents}
-keep class com.hypertill.db.** { *; }
`,
        )
      }

      return mod
    },
  ])
}

function withHypertill(config, options = {}) {
  if (options.disableJsi === true) {
    return config
  }

  let currentConfig = config
  currentConfig = withSettings(currentConfig)
  currentConfig = withBuildGradle(currentConfig)
  currentConfig = withMainApplicationPackage(currentConfig)
  currentConfig = withProguardRules(currentConfig)
  return currentConfig
}

module.exports = withHypertill
module.exports.default = withHypertill
