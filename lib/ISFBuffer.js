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
  var i, len, ref, results, texture;
  if (this.width !== w || this.height !== h) {
    this.width = w;
    this.height = h;
    ref = this.textures;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      texture = ref[i];
      results.push(texture.setSize(w, h));
    }
    return results;
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
  return this.flipFlop = !this.flipFlop;
};

ISFBuffer.prototype.destroy = function() {
  var i, len, ref, texture;
  ref = this.textures;
  for (i = 0, len = ref.length; i < len; i++) {
    texture = ref[i];
    texture.destroy();
  }
  return this.gl.deleteFramebuffer(this.fbo);
};

exports.ISFBuffer = ISFBuffer;
