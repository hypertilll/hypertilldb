const babel = require('@babel/core')
const babelConfig = require('../babel.config')

const isTypeScriptFile = (filename) => /\.tsx?$/.test(filename)

const getPlugins = (filename) =>
  babelConfig.env.test.plugins.flatMap((plugin) => {
    if (isTypeScriptFile(filename) && plugin === '@babel/plugin-transform-flow-strip-types') {
      return [
        [
          '@babel/plugin-transform-typescript',
          {
            allExtensions: true,
            allowDeclareFields: true,
            isTSX: filename.endsWith('.tsx'),
          },
        ],
      ]
    }

    return [plugin]
  })

const transform = ({ src, filename /* , options: { dev } */ }) => {
  // const nodeEnv = dev ? 'development' : 'production'
  const config = {
    filename,
    sourceFileName: filename,
    babelrc: false,
    ast: true,
    plugins: getPlugins(filename),
  }

  const { ast, code, map } = babel.transform(src, config)

  return {
    ast,
    code,
    map,
    filename,
  }
}

module.exports = {
  transform,
}
