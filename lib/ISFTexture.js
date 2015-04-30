var ISFGL = require("./ISFGL.js").ISFGL;

function ISFTexture(params) {
  if (params == null) {
    params = {};
  }
  this.float = params.float;
  this.gl = ISFGL.gl;
  this.texture = this.gl.createTexture();
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
  this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
  this.gl.bindTexture(this.gl.TEXTURE_2D, null);
}

ISFTexture.prototype.bind = function(location) {
  if (location == null) {
    location = -1;
  }
  var newTexUnit = ISFGL.newTextureIndex();
  this.gl.activeTexture(this.gl.TEXTURE0 + newTexUnit);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  if (location !== -1) {
    return this.gl.uniform1i(location, newTexUnit);
  }
};

ISFTexture.prototype.setSize = function(w, h) {
  if (this.width !== w || this.height !== h) {
    this.width = w;
    this.height = h;
    var pixelType = this.float ? this.gl.FLOAT : this.gl.UNSIGNED_BYTE;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, pixelType, null);
  }
};

ISFTexture.prototype.destroy = function() {
  this.gl.deleteTexture(this.texture);
};

exports.ISFTexture = ISFTexture;
