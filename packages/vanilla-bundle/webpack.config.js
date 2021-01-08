const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
const when = (condition, config, negativeConfig) =>
  condition ? ensureArray(config) : ensureArray(negativeConfig);
const path = require('path');
const DtsBundleWebpack = require('dts-bundle-webpack');

// primary config:
const baseUrl = '';
const outDir = path.resolve(__dirname, 'dist');
const srcDir = path.resolve(__dirname, 'src');
const nodeModulesDir = path.resolve(__dirname, 'node_modules');

module.exports = ({ production } = {}) => ({
  mode: production ? 'production' : 'development',
  entry: {
    app: [`${srcDir}/index.ts`],
  },
  stats: {
    warnings: false
  },
  // devtool: production ? 'nosources-source-map' : 'cheap-source-map',
  devtool: 'cheap-source-map',
  target: production ? 'browserslist' : 'web',
  output: {
    path: production ? `${outDir}/bundle` : `${outDir}/bundle-dev`, // includes sourcemap
    publicPath: baseUrl,
    filename: 'slickgrid-vanilla-bundle.js',
    sourceMapFilename: 'slickgrid-vanilla-bundle.js.map',
    libraryTarget: 'umd',
    library: 'Slickgrid-Universal',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [srcDir, 'node_modules'],
    mainFields: production ? ['module', 'main'] : ['browser', 'module', 'main'],
    alias: {
      dompurify: 'dompurify/dist/purify.es.js',
      moment: 'moment/moment.js'
    }
  },
  module: {
    rules: [
      { test: /\.html$/i, loader: 'html-loader' },
      { test: /\.ts?$/, use: 'ts-loader', exclude: nodeModulesDir, },
    ],
  },
  plugins: [
    ...when(production, new DtsBundleWebpack({
      name: 'slicker-bundle',
      main: 'dist/commonjs/index.d.ts',
      out: `${outDir}/bundle/index.d.ts`,
    }))
  ]
});
