const ISFGLState = function (gl) {
  this.gl = gl;
  this.textureIndex = 0;
};

ISFGLState.prototype.newTextureIndex = function () {
  const i = this.textureIndex;
  this.textureIndex += 1;
  return i;
};

ISFGLState.prototype.reset = function () {
  this.textureIndex = 0;
};

module.exports = ISFGLState;
