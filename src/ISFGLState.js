const ISFGLState = function ISFGLState(gl) {
  this.gl = gl;
  this.textureIndex = 0;
};

ISFGLState.prototype.newTextureIndex = function newTextureIndex() {
  const i = this.textureIndex;
  this.textureIndex += 1;
  return i;
};

ISFGLState.prototype.reset = function reset() {
  this.textureIndex = 0;
};

export default ISFGLState;
