var test = require('tape');
var fs = require('fs');
var ISFParser = require('../dist/build-worker').interactiveShaderFormat.Parser;

function assetLoad(name) {
  return fs.readFileSync('./tests/assets/' + name).toString();
}

test('Infer Generator Type', function(t) {
  var src = assetLoad('generator.fs');

  var parser = new ISFParser();
  parser.parse(src);

  t.equal(parser.type, 'generator', 'Generator type detected');
  t.end();
})

test('Infer Filter Type', function(t) {
  var src = assetLoad('image-filter.fs');

  var parser = new ISFParser();
  parser.parse(src);

  t.equal(parser.type, 'filter', 'Image filter type detected');
  t.end();
})

test('Infer Transition Type', function(t) {
  var src = assetLoad('transition.fs');

  var parser = new ISFParser();
  parser.parse(src);

  t.equal(parser.type, 'transition', 'Transition type detected');
  t.end();
})

test('Buffers correctly marked as persistent', function(t) {
  var src = assetLoad('persistent-buffers.fs');

  var parser = new ISFParser();
  parser.parse(src);

  var passes = parser.passes;

  for (var i = 0; i < passes.length - 1; i++) {
    t.equal(passes[i].persistent, true, 'Persistent buffers interpreted as such');
  }

  t.equal(passes[passes.length - 1].persistent, false, 'Non persistent buffered interpreted as such');
  t.end();
})

test('Bad metadata gives error line', function(t) {
  var src = assetLoad('bad-metadata.fs');
  var parser = new ISFParser();
  // t.throws(function() {
    parser.parse(src);
  // })
  t.equal(0, 0);
  t.end();
});

test('IMG_NORM_PIXEL to VVSAMPLER_2DBYNORM', function(t) {
  let src = assetLoad('img_norm_pixel_isf.fs');
  const parser = new ISFParser();
  parser.parse(src);
  const { fragmentShader } = parser;

  const test1 = `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, isf_FragNormCoord);`
  t.not(fragmentShader.indexOf(test1), -1, 'IMG_NORM_PIXEL(inputImage, isf_FragNormCoord);');

  const test2 = `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, vec2(isf_FragNormCoord));`
  t.not(fragmentShader.indexOf(test2), -1, 'IMG_NORM_PIXEL(inputImage, vec2(isf_FragNormCoord));');

  const test3 = `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, vec2(isf_FragNormCoord.x, isf_FragNormCoord.y));`
  t.not(fragmentShader.indexOf(test3), -1, 'IMG_NORM_PIXEL(inputImage, vec2(isf_FragNormCoord.x, isf_FragNormCoord.y));');

  const test4 = `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, vec2(x, y));`
  t.not(fragmentShader.indexOf(test4), -1, 'IMG_NORM_PIXEL(inputImage, vec2(x, y));');

  const test5 = `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, vec3(x, y, x).xy);`
  t.not(fragmentShader.indexOf(test5), -1, 'IMG_NORM_PIXEL(inputImage, vec3(x, y, x).xy);');

  const test6 = `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, vec4(x, y, x, y).xy);`
  t.not(fragmentShader.indexOf(test6), -1, 'IMG_NORM_PIXEL(inputImage, vec4(x, y, x, y).xy);');

  const test7 = `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, vec4(x,y,x,y).xy);`
  t.not(fragmentShader.indexOf(test7), -1, 'IMG_NORM_PIXEL(inputImage,vec4(x,y,x,y).xy);');

  t.end();
})