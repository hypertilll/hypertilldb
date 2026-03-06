const { withAppBuildGradle, withDangerousMod, withMainApplication, withSettingsGradle } = require('@expo/config-plugins')
const fs = require('fs/promises')

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
