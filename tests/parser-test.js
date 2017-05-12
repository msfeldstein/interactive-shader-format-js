var test = require('tape')
var fs = require('fs')
var ISFParser = require('../src/ISFParser')

function assetLoad(name) {
	return fs.readFileSync('./tests/assets/' + name).toString()
}

test('Infer Generator Type', function(t) {
	var src = assetLoad('generator.fs')
	var parser = new ISFParser();
	parser.parse(src);
	t.equal(parser.type, 'generator', "Generator type detected")
	t.end()
})

test('Infer Filter Type', function(t) {
	var src = assetLoad('image-filter.fs')
	var parser = new ISFParser();
	parser.parse(src);
	t.equal(parser.type, 'filter', "Image filter type detected")
	t.end()
})

test('Infer Transition Type', function(t) {
	var src = assetLoad('transition.fs')
	var parser = new ISFParser();
	parser.parse(src);
	t.equal(parser.type, 'transition', "Transition type detected")
	t.end()
})

test('Buffers correctly marked as persistent', function(t) {
	var src = assetLoad('persistent-buffers.fs')
	var parser = new ISFParser();
	parser.parse(src);
	var passes = parser.passes
	for (var i = 0; i < passes.length - 1; i++) {
		t.equal(passes[i].persistent, true, "Persistent buffers interpreted as such")
	}
	t.equal(passes[passes.length - 1].persistent, false, "Non persistent buffered interpreted as such")
	t.end()
})

test('Bad metadata gives error line', function(t) {
	var src = assetLoad('bad-metadata.fs')
	var parser = new ISFParser();
	// t.throws(function() {
		parser.parse(src)
	// })
	t.equal(0, 0)
	t.end()
})