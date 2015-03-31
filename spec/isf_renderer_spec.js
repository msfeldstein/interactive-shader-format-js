var imagediff = require('imagediff')
describe("ISFRenderer", function() {
  var ISFRenderer = require('../lib/ISFRenderer.js').ISFRenderer;

  beforeEach(function () {
    jasmine.addMatchers(imagediff.jasmine);
  });

  it("should render a sketch with no parameters correctly", function() {
    expect(true).toBeTruthy();
  });


  it("should render a sketch with parameters correctly", function() {
    expect(false).toBeTruthy();
  });
});
