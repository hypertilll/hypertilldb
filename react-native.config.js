module.exports = {
  // This is for auto-linking Hypertill DB as a library
  dependency: {
    platforms: {
      android: {
        sourceDir: './native/android',
      },
      windows: {
        sourceDir: '.\\native\\windows',
        solutionFile: 'HypertillDB.sln',
        projects: [
          {
            projectFile: 'HypertillDB\\HypertillDB.vcxproj',
            directDependency: true,
          }
        ],
      },
    },
  },
  // This is for Hypertill DB project internals
  project: {
    android: {
      sourceDir: './native/androidTest',
    },
    ios: {
      sourceDir: './native/iosTest',
    },
    windows: {
      sourceDir: 'native\\windowsTest',
      solutionFile: 'HypertillTester.sln',
      project: {
        projectFile: 'HypertillTester\\HypertillTester.vcxproj',
      },
    },
  },
}
