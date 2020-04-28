const { ProvidePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
const when = (condition, config, negativeConfig) =>
  condition ? ensureArray(config) : ensureArray(negativeConfig);
const path = require('path');

// primary config:
const title = 'Slickgrid-Universal';
const baseUrl = '';
const outDirLocal = path.resolve(__dirname, 'dist');
const outDirProd = path.resolve(__dirname, '../../docs');
const srcDir = path.resolve(__dirname, 'src');
const nodeModulesDir = path.resolve(__dirname, 'node_modules');
const platform = {
  hmr: false,
  open: true,
  port: 8888,
  host: 'localhost',
  output: 'dist'
};

module.exports = ({ production } = {}, { extractCss, analyze, tests, hmr, port, host } = {}) => ({
  mode: production ? 'production' : 'development',
  entry: {
    app: [`${srcDir}/main.ts`],
  },
  stats: {
    warnings: false
  },
  output: {
    path: production ? outDirProd : outDirLocal,
    publicPath: baseUrl,
    filename: production ? '[name].[chunkhash].bundle.js' : '[name].[hash].bundle.js',
    sourceMapFilename: production ? '[name].[chunkhash].bundle.map' : '[name].[hash].bundle.map',
    chunkFilename: production ? '[name].[chunkhash].chunk.js' : '[name].[hash].chunk.js'
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
      {
        test: /\.css$/i,
        issuer: [{ not: [{ test: /\.html$/i }] }],
        use: extractCss ? [{ loader: MiniCssExtractPlugin.loader }, 'css-loader'] : ['style-loader', ...{ loader: 'css-loader' }]
      },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'], issuer: /\.[tj]s$/i },
      { test: /\.scss$/, use: ['css-loader', 'sass-loader'], issuer: /\.html?$/i },
      { test: /\.(png|gif|jpg|cur)$/i, loader: 'url-loader', options: { limit: 8192 } },
      { test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/, loader: 'file-loader' },
      { test: /\.html$/i, loader: 'html-loader' },
      { test: /\.ts?$/, use: [{ loader: 'ts-loader', options: { transpileOnly: true } }] }
    ],
  },
  devServer: {
    contentBase: production ? outDirProd : outDirLocal,
    // serve index.html for all 404 (required for push-state)
    historyApiFallback: true,
    hot: hmr || platform.hmr,
    port: port || platform.port,
    host: host || platform.host,
    open: platform.open,
  },
  devtool: production ? 'nosources-source-map' : 'cheap-module-eval-source-map',
  plugins: [
    new ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
    new HtmlWebpackPlugin({
      template: 'index.ejs',
      favicon: `${srcDir}/favicon.ico`,
      metadata: {
        // available in index.ejs //
        title, baseUrl
      }
    }),
    new CopyWebpackPlugin([
      // { from: 'static', to: outDir, ignore: ['.*'] }, // ignore dot (hidden) files
      { from: `${srcDir}/favicon.ico`, to: 'favicon.ico' },
      // { from: 'assets', to: 'assets' }
    ]),
    ...when(extractCss, new MiniCssExtractPlugin({ // updated to match the naming conventions for the js files
      filename: production ? '[name].[contenthash].bundle.css' : '[name].[hash].bundle.css',
      chunkFilename: production ? '[name].[contenthash].chunk.css' : '[name].[hash].chunk.css'
    })),
    // Note that the usage of following plugin cleans the webpack output directory before build.
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin()
  ]
});
