const { ProvidePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ensureArray = (config) => config && (Array.isArray(config) ? config : [config]) || [];
const when = (condition, config, negativeConfig) =>
  condition ? ensureArray(config) : ensureArray(negativeConfig);
const path = require('path');

// primary config:
const title = 'Slickgrid-Universal';
const baseUrl = '';
const outDir = path.resolve(__dirname, 'dist');
const srcDir = path.resolve(__dirname, 'src');
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
    app: [`${srcDir}/main.ts`],
  },
  stats: {
    warnings: false
  },
  output: {
    path: outDir,
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
        use: extractCss ? [{ loader: MiniCssExtractPlugin.loader }, 'css-loader'] : ['style-loader', ...cssRules]
      },
      { test: /\.(png|gif|jpg|cur)$/i, loader: 'url-loader', options: { limit: 8192 } },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'], issuer: /\.[tj]s$/i },
      { test: /\.scss$/, use: ['css-loader', 'sass-loader'], issuer: /\.html?$/i },
      { test: /\.html$/i, loader: 'html-loader' },
      { test: /\.ts?$/, use: 'ts-loader', exclude: nodeModulesDir, },
    ],
  },
  devServer: {
    contentBase: outDir,
    // serve index.html for all 404 (required for push-state)
    historyApiFallback: true,
    hot: hmr || platform.hmr,
    port: port || platform.port,
    host: host || platform.host,
    open: true,
  },
  devtool: production ? 'nosources-source-map' : 'cheap-module-eval-source-map',
  plugins: [
    new ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
    ...when(!production, new HtmlWebpackPlugin({
      template: 'index.ejs',
      metadata: {
        // available in index.ejs //
        title, baseUrl
      }
    })),
    ...when(!production, new CopyWebpackPlugin([
      // { from: 'static', to: outDir, ignore: ['.*'] }, // ignore dot (hidden) files
      { from: `${srcDir}/favicon.ico`, to: 'favicon.ico' },
      // { from: 'assets', to: 'assets' }
    ])),
    ...when(extractCss, new MiniCssExtractPlugin({ // updated to match the naming conventions for the js files
      filename: production ? '[name].[contenthash].bundle.css' : '[name].[hash].bundle.css',
      chunkFilename: production ? '[name].[contenthash].chunk.css' : '[name].[hash].chunk.css'
    })),
  ]
});
