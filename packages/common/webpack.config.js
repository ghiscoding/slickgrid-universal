const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ProvidePlugin } = require('webpack');
const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
const when = (condition, config, negativeConfig) =>
  condition ? ensureArray(config) : ensureArray(negativeConfig);
const path = require('path');
// primary config:
const baseUrl = '';
const outDir = path.resolve(__dirname, 'dist');
const srcDir = path.resolve(__dirname, 'src');
const srcLibDir = path.resolve(__dirname, 'src/slickgrid-universal');
const nodeModulesDir = path.resolve(__dirname, 'node_modules');
const cssRules = [
  { loader: 'css-loader' },
];
const platform = {
  hmr: false,
  open: false,
  port: 8080,
  host: 'localhost',
  output: 'dist'
};

module.exports = ({ production } = {}, { extractCss, analyze, tests, hmr, port, host } = {}) => ({
  mode: production ? 'production' : 'development',
  entry: {
    app: [`${srcLibDir}/index.ts`],
  },
  stats: {
    warnings: false
  },
  output: {
    path: `${outDir}/bundle`,
    publicPath: baseUrl,
    filename: production ? 'slickgrid-grid-bundle.js' : 'slickgrid-grid-bundle.js',
    sourceMapFilename: production ? 'slickgrid-grid-bundle.map' : 'slickgrid-grid-bundle.map',
    libraryTarget: 'umd',
    library: 'MyLib',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [srcDir, 'node_modules'],
    alias: {
      moment$: 'moment/moment.js'
    }
  },
  module: {
    rules: [
      // CSS required in JS/TS files should use the style-loader that auto-injects it into the website
      // only when the issuer is a .js/.ts file, so the loaders are not applied inside html templates
      {
        test: /\.css$/i,
        issuer: [{ not: [{ test: /\.html$/i }] }],
        use: extractCss ? [{
          loader: MiniCssExtractPlugin.loader
        },
          'css-loader'
        ] : ['style-loader', ...cssRules]
      },
      {
        test: /\.css$/i,
        issuer: [{ test: /\.html$/i }],
        // CSS required in templates cannot be extracted safely
        // because Aurelia would try to require it again in runtime
        use: cssRules
      },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'], issuer: /\.[tj]s$/i },
      { test: /\.scss$/, use: ['css-loader', 'sass-loader'], issuer: /\.html?$/i },
      { test: /\.html$/i, loader: 'html-loader' },
      { test: /\.ts?$/, use: 'ts-loader', exclude: nodeModulesDir, },
      { test: /\.(png|gif|jpg|cur)$/i, loader: 'url-loader', options: { limit: 8192 } },
      { test: require.resolve('jquery'), loader: 'expose-loader?$!expose-loader?jQuery' },
    ],
  },
  devtool: production ? 'nosources-source-map' : 'cheap-module-eval-source-map',
  plugins: [
    new ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
    ...when(extractCss, new MiniCssExtractPlugin({ // updated to match the naming conventions for the js files
      filename: production ? 'slickgrid-grid-bundle.css' : 'slickgrid-grid-bundle.css',
      chunkFilename: production ? 'slickgrid-grid-bundle.css' : 'slickgrid-grid-bundle.css'
    })),
  ]
});
