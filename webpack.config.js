var HtmlWebpackPlugin = require('html-webpack-plugin')
var path = require('path')
var pathToPhaser = path.join(__dirname, '/node_modules/phaser/')
var phaser = path.join(pathToPhaser, 'dist/phaser.js')

const entries = {
  static: './static-maps/src/index.ts',
  dynamic: './dynamic-maps/src/index.ts',
}

module.exports = {
  entry: entries.dynamic,
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
  },
  plugins: [new HtmlWebpackPlugin()],
  module: {
    rules: [{
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: '/node_modules/',
      },
      {
        test: /phaser\.js$/,
        loader: 'expose-loader?Phaser',
      },
    ],
  },
  devServer: {
    contentBase: path.resolve(__dirname, './'),
    publicPath: '/build/',
    host: '127.0.0.1',
    port: 8080,
    open: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      phaser: phaser,
    },
  },
}
