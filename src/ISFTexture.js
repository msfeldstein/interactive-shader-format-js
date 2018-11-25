function ISFTexture(params, contextState) {
  if (params == null) {
    params = {};
  }
  this.contextState = contextState;
  this.float = params.float;
  this.gl = this.contextState.gl;
  this.texture = this.gl.createTexture();
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
  this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
  this.gl.bindTexture(this.gl.TEXTURE_2D, null);
}

ISFTexture.prototype.bind = function textureBind(location) {
  if (location === null || location === undefined) {
    location = -1;
  }
  const newTexUnit = this.contextState.newTextureIndex();
  this.gl.activeTexture(this.gl.TEXTURE0 + newTexUnit);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  if (location !== -1) {
    this.gl.uniform1i(location, newTexUnit);
  }
};

ISFTexture.prototype.setSize = function setSize(w, h) {
  if (this.width !== w || this.height !== h) {
    this.width = w;
    this.height = h;
    const pixelType = this.float ? this.gl.FLOAT : this.gl.UNSIGNED_BYTE;
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, pixelType, null);
  }
};

ISFTexture.prototype.destroy = function destroy() {
  this.gl.deleteTexture(this.texture);
};

export default ISFTexture;
