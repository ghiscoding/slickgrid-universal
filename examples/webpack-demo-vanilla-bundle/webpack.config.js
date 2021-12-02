const { HotModuleReplacementPlugin, ProvidePlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

// primary config:
const title = 'Slickgrid-Universal';
const baseUrl = '';
const outDirLocal = path.resolve(__dirname, 'dist');
const outDirProd = path.resolve(__dirname, '../../docs');
const srcDir = path.resolve(__dirname, 'src');

module.exports = ({ production } = {}) => ({
  mode: production ? 'production' : 'development',
  entry: `${srcDir}/main.ts`,
  stats: {
    warnings: false
  },
  target: production ? 'browserslist' : 'web',
  devServer: {
    static: {
      directory: production ? outDirProd : outDirLocal,
    },
    historyApiFallback: true,
    compress: true,
    liveReload: false,
    port: 8888,
    host: 'localhost',
    // open: true,
  },
  devtool: production ? false : 'eval-cheap-module-source-map',
  output: {
    path: production ? outDirProd : outDirLocal,
    publicPath: baseUrl,
    filename: '[name].[contenthash].bundle.js',
    sourceMapFilename: '[name].[contenthash].bundle.js.map',
    chunkFilename: '[name].[contenthash].chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [srcDir, 'node_modules'],
    mainFields: ['browser', 'module', 'main'],
    fallback: {
      http: false,
      https: false,
      stream: false,
      util: false,
      zlib: false,
    }
  },
  module: {
    rules: [
      { test: /\.css$/i, use: [{ loader: MiniCssExtractPlugin.loader }, 'css-loader'] },
      { test: /\.(sass|scss)$/, use: ['style-loader', 'css-loader', 'sass-loader'], issuer: /\.[tj]s$/i },
      { test: /\.(sass|scss)$/, use: ['css-loader', 'sass-loader'], issuer: /\.html?$/i },
      { test: /\.html$/i, loader: 'html-loader', options: { esModule: false } },
      {
        test: /\.ts?$/,
        loader: 'esbuild-loader',
        options: { loader: 'ts', target: 'es2018' }
      },
    ],
  },
  optimization: {
    minimizer: [
      new ESBuildMinifyPlugin({
        target: 'es2018',
        format: 'iife',
        css: true,
      })
    ]
  },
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
    new CopyWebpackPlugin({
      patterns: [
        { from: `${srcDir}/favicon.ico`, to: 'favicon.ico' },
        { from: 'assets', to: 'assets' },
        { from: 'src/examples/data', to: 'assets/data' }
      ]
    }),
    new MiniCssExtractPlugin({ // updated to match the naming conventions for the js files
      filename: '[name].[contenthash].bundle.css',
      chunkFilename: '[name].[contenthash].chunk.css'
    }),
    // Note that the usage of following plugin cleans the webpack output directory before build.
    new CleanWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new HotModuleReplacementPlugin(),
  ]
});
