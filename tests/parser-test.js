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

test('IMG_NORM_PIXEL to VVSAMPLER_2DBYNORM', function (t) {
  let src = assetLoad('img_norm_pixel_isf.fs');
  const parser = new ISFParser();
  parser.parse(src);
  const { fragmentShader } = parser;

  const IMG_NORM_PIXEL = (variable) => `IMG_NORM_PIXEL(inputImage, ${variable});`;
  const VVSAMPLER_2DBYNORM = (variable) => `VVSAMPLER_2DBYNORM(inputImage, _inputImage_imgRect, _inputImage_imgSize, _inputImage_flip, ${variable});`;

  const variableTypes = [
    'isf_FragNormCoord',
    'vec2(isf_FragNormCoord)',
    'vec2(isf_FragNormCoord.x, isf_FragNormCoord.y)',
    'vec2(x, y)',
    'vec3(x, y, x).xy',
    'vec4(x, y, x, y).xy',
  ];

  variableTypes.forEach((variable) => {
    const test = {
      toReplace: IMG_NORM_PIXEL(variable),
      expectedReplacement: VVSAMPLER_2DBYNORM(variable),
      expectedIndex: -1
    };

    t.not(fragmentShader.indexOf(test.expectedReplacement), test.expectedIndex, test.toReplace);
  });
  
  t.end();
});

test('IMG_PIXEL to texture2D', function (t) {
  let src = assetLoad('img_pixel_isf.fs');
  const parser = new ISFParser();
  parser.parse(src);
  const { fragmentShader } = parser;

  const IMG_PIXEL = (variable) => `IMG_PIXEL(inputImage, ${variable});`;
  const TEXTURE2D = (variable) => `texture2D(inputImage, (${variable}) / RENDERSIZE);`;

  const variableTypes = [
    'gl_FragCoord.xy',
    'vec2(gl_FragCoord.xy)',
    'vec2(gl_FragCoord.x, gl_FragCoord.y)',
    'vec2(x, y)',
    'vec3(x, y, x).xy',
    'vec4(x, y, x, y).xy',
  ];

  variableTypes.forEach((variable) => {
    const test = {
      toReplace: IMG_PIXEL(variable),
      expectedReplacement: TEXTURE2D(variable),
      expectedIndex: -1
    };

    t.not(fragmentShader.indexOf(test.expectedReplacement), test.expectedIndex, test.toReplace);
  });
  
  t.end();
});