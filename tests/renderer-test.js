var test = require('tape')
var fs = require('fs')
var getPixels = require("get-pixels")
var savePixels = require("save-pixels")
var gl = require('gl')
var ndarray = require('ndarray')
var imshow = require("ndarray-imshow")
var imageDiff = require('image-diff')
var ISFRenderer = require('../lib/ISFRenderer').ISFRenderer

function assetLoad(name) {
	return fs.readFileSync('./tests/assets/' + name).toString()
}
var width = 128, height = 128

function matchFilterToExpected(src, expected, cb) {
	var ctx = gl(128, 128)
	var renderer = new ISFRenderer(ctx)
	renderer.loadSource(src)
	renderer.draw({width: width, height: height})
	var pixels = new Uint8Array(width * height * 4)
	ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, pixels)
	var nd = ndarray(pixels, [width, height, 4])
	var filename = "tmp/" + Math.random() + ".png"
	var writableStream = fs.createWriteStream(filename)
	savePixels(nd, "png").pipe(writableStream)
	imageDiff({
		actualImage: filename,
		expectedImage: './tests/expected/generator.png'
	}, function(err, areSame) {
		if (err) throw err
		cb(areSame)
	})
}

test('Basic Generator Rendering', function(t) {
	var generatorSrc = assetLoad('generator.fs')
	matchFilterToExpected(generatorSrc, "./tests/expected/generator.png", (same) => {
		t.equals(same, true)
		t.end()
	})
})
