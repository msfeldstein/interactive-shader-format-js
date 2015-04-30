var ISFTexture = require("./ISFTexture.js").ISFTexture;

function ISFBuffer(pass) {
  this.gl = ISFGL.gl;
  this.persistent = pass.persistent;
  this.float = pass.float;
  this.name = pass.target;
  this.textures = [];
  this.textures.push(new ISFTexture(pass));
  this.textures.push(new ISFTexture(pass));
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

exports.ISFBuffer = ISFBuffer;
