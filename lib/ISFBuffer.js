var ISFTexture = require("./ISFTexture.js");

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

ISFBuffer.prototype.setSize = function(w, h) {
  if (this.width !== w || this.height !== h) {
    this.width = w;
    this.height = h;
    for (var i = 0; i < this.textures.length; i++) {
      var texture = this.textures[i];
      texture.setSize(w, h);
    }
  }
};

ISFBuffer.prototype.readTexture = function() {
  if (this.flipFlop) {
    return this.textures[1];
  } else {
    return this.textures[0];
  }
};

ISFBuffer.prototype.writeTexture = function() {
  if (!this.flipFlop) {
    return this.textures[1];
  } else {
    return this.textures[0];
  }
};

ISFBuffer.prototype.flip = function() {
  this.flipFlop = !this.flipFlop;
};

ISFBuffer.prototype.destroy = function() {
  for (var i = 0; i < this.textures.length; i++) {
    var texture = this.textures[i];
    texture.destroy();
  }
  this.gl.deleteFramebuffer(this.fbo);
};

module.exports = ISFBuffer;
