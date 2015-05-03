var ISFGLState = function(gl) {
  this.gl = gl;
  this.textureIndex = 0;
}

ISFGLState.prototype.newTextureIndex = function() {
  var i = this.textureIndex;
  this.textureIndex += 1;
  return i;
}

ISFGLState.prototype.reset = function() {
  this.textureIndex = 0;
}

exports.ISFGLState = ISFGLState;
