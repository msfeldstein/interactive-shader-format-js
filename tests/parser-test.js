var test = require('tape')
var fs = require('fs')
var ISFParser = require('../lib/ISFParser').ISFParser
function assetLoad(name) {
	return fs.readFileSync('./tests/assets/' + name).toString()
}

test('Infer Generator Type', function(t) {
	var src = assetLoad('generator.fs')
	var parser = new ISFParser();
	parser.parse(src);
	t.equal(parser.type, 'generator')
	t.end()
})

test('Infer Filter Type', function(t) {
	var src = assetLoad('image-filter.fs')
	var parser = new ISFParser();
	parser.parse(src);
	t.equal(parser.type, 'filter')
	t.end()
})

test('Infer Transition Type', function(t) {
	var src = assetLoad('transition.fs')
	var parser = new ISFParser();
	parser.parse(src);
	t.equal(parser.type, 'transition')
	t.end()
})

test('Buffers correctly marked as persistent', function(t) {
	var src = assetLoad('with-persistent-buffers.fs')
	var parser = new ISFParser();
	parser.parse(src);
	var passes = parser.passes
	for (var i = 0; i < passes.length - 1; i++) {
		t.equal(passes[i].persistent, true)
	}
	t.equal(passes[passes.length - 1].persistent, false)
	t.end()
})
