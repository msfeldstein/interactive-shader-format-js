var imagediff = require('imagediff');
var Canvas = require('Canvas');
var fs = require('fs');
var WebGL = require('node-webgl');


describe("ISFRenderer", function() {
  var ISFRenderer = require('../lib/ISFRenderer.js').ISFRenderer;
  var document = new WebGL.document();

  beforeEach(function () {
    jasmine.addMatchers(imagediff.jasmine);
  });

  it("should render a sketch with no parameters correctly", function() {
    var expectedOutput = new WebGL.Image();
    var imageContent = fs.readFileSync("spec/files/dark.png")
    expectedOutput.src = imageContent;

    var canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    var gl = canvas.getContext("webgl");

    var source = fs.readFileSync("spec/files/no-parameters.fs")
    var renderer = new ISFRenderer(gl);
    renderer.loadSource(source.toString());
    renderer.draw(canvas);
  });


  it("should render a sketch with parameters correctly", function() {
    // expect(false).toBeTruthy();
  });
});
