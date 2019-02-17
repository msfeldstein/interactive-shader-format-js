var test = require('tape');
var fs = require('fs');
var getPixels = require('get-pixels');
var savePixels = require('save-pixels');
var gl = require('gl');
var ndarray = require('ndarray');
var pixelmatch = require('pixelmatch');
var PNG = require('pngjs').PNG;
var ISFRenderer = require('../dist/build-worker').interactiveShaderFormat.Renderer;

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

  const currentStream = savePixels(nd, 'png').pipe(writableStream);

  var expectedFilename = expected.split('/')[expected.split('/').length - 1];

  const img1 = fs.createReadStream(filename).pipe(new PNG()).on('parsed', doneReading);
  const img2 = fs.createReadStream(expected).pipe(new PNG()).on('parsed', doneReading);
  let filesRead = 0;

  function doneReading() {
    if (++filesRead < 2) return;
    var diff = new PNG({width: img1.width, height: img1.height});

    const numDiff = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
      threshold: 0.1,
    });

    diff.pack().pipe(fs.createWriteStream(expectedFilename));

    const goodEnough = !numDiff;
    console.log(!numDiff ? 'No difference!' : `Got ${numDiff} different pixel(s)`);

    callbacks.finished(goodEnough);
  }
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
});

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
});
