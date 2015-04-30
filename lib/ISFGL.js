ISFGL = {
  init: function(gl) {
    ISFGL.gl = gl;
    ISFGL.textureIndex = 0;
  },

  newTextureIndex: function() {
    var i = ISFGL.textureIndex;
    ISFGL.textureIndex += 1;
    return i;
  },

  cleanup: function() {
    ISFGL.textureIndex = 0;
  }
};

exports.ISFGL = ISFGL;
