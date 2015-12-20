var ISFBuffer = require("./ISFBuffer.js").ISFBuffer;
var ISFTexture = require("./ISFTexture.js").ISFTexture;

/* 
 * Params are
 * gl: a GL Context
 * frames: the number of frames to store
 * size: width and height of the render size
 */
var ISFBufferQueue = function(params) {
  this.contextState = params.contextState
  this.fbo = this.contextState.gl.createFramebuffer();
  this.buffers = []
  this.size = params.size
  for (var j = 0; j < params.frames; j++) {
    var tex = new ISFTexture({}, params.contextState)
    tex.setSize(params.size.width, params.size.height)
    this.buffers.push(tex)
  }
}

ISFBufferQueue.prototype.nextWriteFrame = function() {
  var next = this.buffers.shift()
  this.buffers.push(next)
  return next
}

ISFBuffer.prototype.destroy = function() {
  for (var i = 0; i < this.buffers.length; i++) {
    var texture = this.buffers[i];
    texture.destroy();
  }
  this.gl.deleteFramebuffer(this.fbo);
};

module.exports = ISFBufferQueue