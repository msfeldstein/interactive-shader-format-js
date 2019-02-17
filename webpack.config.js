const path = require('path');

const domConfig = {
  target: 'web',
  entry: './src/main.js',
  output: {
    library: 'interactiveShaderFormat',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    filename: 'build.js',
  },
};

const workerConfig = {
  target: 'webworker',
  entry: './src/main.js',
  output: {
    library: 'interactiveShaderFormat',
    libraryTarget: 'this',
    path: path.resolve(__dirname, 'dist'),
    filename: 'build-worker.js',
  },
};

module.exports = [domConfig, workerConfig];
