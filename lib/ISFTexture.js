(function() {
  this.ISFTexture = (function() {
    function ISFTexture(params) {
      if (params == null) {
        params = {};
      }
      this.float = params.float;
      this.gl = ISFGL.gl;
      this.texture = this.gl.createTexture();
      this.textureUnit = ISFGL.newTextureIndex();
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
      this.gl.activeTexture(this.gl.TEXTURE0 + this.textureUnit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      if (location !== -1) {
        return this.gl.uniform1i(location, this.textureUnit);
      }
    };

    ISFTexture.prototype.setSize = function(w, h) {
      var pixelType;
      if (this.width !== w || this.height !== h) {
        this.width = w;
        this.height = h;
        pixelType = this.float ? this.gl.FLOAT : this.gl.UNSIGNED_BYTE;
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        return this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, pixelType, null);
      }
    };

    ISFTexture.prototype.destroy = function() {
      return this.gl.deleteTexture(this.texture);
    };

    return ISFTexture;

  })();

}).call(this);
