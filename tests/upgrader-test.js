var test = require('tape');
var fs = require('fs');

var { Upgrader, Parser } = require('../dist/build-worker').interactiveShaderFormat;

function assetLoad(name) {
  return fs.readFileSync('./tests/assets/' + name).toString();
}

test('Upgrade fragment shader to v2', (t) => {
  var old = assetLoad('version1.fs');
  var upgraded = Upgrader.convertFragment(old);

  t.equal(upgraded, assetLoad('version1.upgraded.fs'), 'upgraded correctly');
  t.end();
})

test('Upgrade vertex shader to v2', (t) => {
  var old = assetLoad('version1.vs');
  var upgraded = Upgrader.convertVertex(old);

  t.equal(upgraded, assetLoad('version1.upgraded.vs'), 'upgraded correctly');
  t.end();
})

test('Infer ISF Versioning', function(t) {
  var v1 = assetLoad('version1.fs');
  var parser = new Parser();
  parser.parse(v1);

  t.equal(parser.isfVersion, 1, 'Properly detect v1 with PERSISTENT_BUFFERS');

  var v1 = assetLoad('version1_basic.fs');
  var parser = new Parser();
  parser.parse(v1);

  t.equal(parser.isfVersion, 1, 'Properly detect v1 without PERSISTENT_BUFFERS');

  var v2 = assetLoad('version1.upgraded.fs');
  parser = new Parser();
  parser.parse(v2);

  t.equal(parser.isfVersion, 2, 'Properly detect v2');
  t.end();
})
