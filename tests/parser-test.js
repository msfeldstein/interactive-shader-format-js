var test = require('tape')
var fs = require('fs')
var ISFParser = require('../lib/ISFParser').ISFParser
function assetLoad(name) {
	return fs.readFileSync('./tests/assets/' + name).toString()
}

test('Infer Generator Type', function(t) {
	var generatorSrc = assetLoad('generator.fs')
	console.log(generatorSrc)
	var parser = new ISFParser();
	parser.parse(generatorSrc);
	t.equal(parser.type, 'generator')
	t.end()
})

test('Infer Filter Type', function(t) {
	var generatorSrc = assetLoad('image-filter.fs')
	console.log(generatorSrc)
	var parser = new ISFParser();
	parser.parse(generatorSrc);
	t.equal(parser.type, 'filter')
	t.end()
})

test('Infer Transition Type', function(t) {
	var generatorSrc = assetLoad('transition.fs')
	console.log(generatorSrc)
	var parser = new ISFParser();
	parser.parse(generatorSrc);
	t.equal(parser.type, 'transition')
	t.end()
})
