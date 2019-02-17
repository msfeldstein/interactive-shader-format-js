import ISFTexture from './ISFTexture';

function ISFBuffer(pass, contextState) {
  this.contextState = contextState;
  this.gl = this.contextState.gl;
  this.persistent = pass.persistent;
  // Since float buffers have a lot of problems in webgl we dont actually use them.
  // This should be revisited.
  // this.float = pass.float;
  this.name = pass.target;
  this.textures = [];
  this.textures.push(new ISFTexture(pass, this.contextState));
  this.textures.push(new ISFTexture(pass, this.contextState));
  this.flipFlop = false;
  this.fbo = this.gl.createFramebuffer();
  this.flipFlop = false;
}

ISFBuffer.prototype.setSize = function setSize(w, h) {
  if (this.width !== w || this.height !== h) {
    this.width = w;
    this.height = h;
    for (let i = 0; i < this.textures.length; i++) {
      const texture = this.textures[i];
      texture.setSize(w, h);
    }
  }
};

ISFBuffer.prototype.readTexture = function readTexture() {
  if (this.flipFlop) {
    return this.textures[1];
  }
  return this.textures[0];
};

ISFBuffer.prototype.writeTexture = function writeTexture() {
  if (!this.flipFlop) {
    return this.textures[1];
  }
  return this.textures[0];
};

ISFBuffer.prototype.flip = function flip() {
  this.flipFlop = !this.flipFlop;
};

ISFBuffer.prototype.destroy = function destroy() {
  for (let i = 0; i < this.textures.length; i++) {
    const texture = this.textures[i];
    texture.destroy();
  }
  this.gl.deleteFramebuffer(this.fbo);
};

export default ISFBuffer;
