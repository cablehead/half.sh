const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: './src/index.js',

  module: {
    rules: [
    /*
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        enforce: 'pre',
        options: {
          formatter: require("eslint/lib/formatters/codeframe"),
          color: false,
          emitError: true,
          failOnError: true
        },
        loader: 'eslint-loader'
      },
      */
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },

  output: {
    filename: 'bundle-[contenthash].js',
    publicPath: '/',
    path: path.resolve(__dirname, 'dist')
  },

  plugins: [
    new HtmlWebpackPlugin({template: 'src/index.html'})
  ]
}
