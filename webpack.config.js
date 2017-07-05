const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src/main.js'),
  output: {
    filename: 'interactive-shader-format.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'interactiveShaderFormat',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [['es2015', { modules: false }]],
        },
      },
    ],
  },
  devServer: {
  },
};
