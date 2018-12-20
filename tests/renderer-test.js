var test = require('tape');
var fs = require('fs');
var getPixels = require('get-pixels');
var savePixels = require('save-pixels');
var gl = require('gl');
var ndarray = require('ndarray');
var imageDiff = require('image-diff');
var ISFRenderer = require('../src/ISFRenderer');

if (!fs.existsSync('tmp')) {
  fs.mkdirSync('tmp');
}

function assetLoad(name) {
  return fs.readFileSync('./tests/assets/' + name).toString();
}

var width = 128;
var height = 128;

const destination = {
  width,
  height,
  offsetWidth: width,
  offsetHeight: height,
};

function matchFilterToExpected(src, expected, callbacks) {
  var ctx = gl(128, 128);
  var renderer = new ISFRenderer(ctx);
  renderer.loadSource(src);

  if (callbacks.steps) {
    callbacks.steps(renderer);
  } else {
    renderer.draw(destination);
  }

  var pixels = new Uint8Array(width * height * 4);
  ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels);

  var nd = ndarray(pixels, [width, height, 4]);

  var filename = `./tmp/${Math.random()}.png`;

  var writableStream = fs.createWriteStream(filename);

  savePixels(nd, 'png').pipe(writableStream);

  var expectedFilename = expected.split('/')[expected.split('/').length - 1];

  imageDiff({
    actualImage: filename,
    expectedImage: expected,
    diffImage: `./tmp/diff.${expectedFilename}`,
  }, function(err, areSame) {
    if (err) {
      throw err;
    }

    callbacks.finished(areSame);
  })
}

test('Basic Generator Rendering', function(t) {
  var generatorSrc = assetLoad('generator.fs')
  var callbacks = {
    finished: (same) => {
      t.equals(same, true);
      t.end();
    },
  };

  matchFilterToExpected(generatorSrc, './tests/expected/generator.png', callbacks);
})


test('Persistent Buffers', function(t) {
  var generatorSrc = assetLoad('persistent-buffers.fs')
  var callbacks = {
    steps: (renderer) => {
      renderer.setValue('xPos', 0);
      renderer.draw(destination);
      renderer.setValue('xPos', 0.5);
      renderer.draw(destination);
      renderer.setValue('xPos', 1.0);
      renderer.draw(destination);
      renderer.draw(destination);
    },

    finished: (same) => {
      t.equals(same, true);
      t.end();
    }
  }

  matchFilterToExpected(generatorSrc, './tests/expected/persistent-buffers.png', callbacks);
})
