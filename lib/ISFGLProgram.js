function ISFGLProgram(gl, vs, fs) {
  this.gl = gl;
  this.vShader = this.createShader(vs, this.gl.VERTEX_SHADER);
  this.fShader = this.createShader(fs, this.gl.FRAGMENT_SHADER);
  this.program = this.createProgram(this.vShader, this.fShader);
  this.locations = {};
}

ISFGLProgram.prototype.use = function() {
  return this.gl.useProgram(this.program);
};

ISFGLProgram.prototype.getUniformLocation = function(name) {
  return this.gl.getUniformLocation(this.program, name);
};

ISFGLProgram.prototype.setUniform1i = function(uniformName, value) {
  if (locations[uniformName] == null) {
    locations[uniformName] = this.getUniformLocation(this.program, uniformName);
  }
  return this.gl.uniform1i(this.paintProgram.texLocation, target.textureUnit);
};

ISFGLProgram.prototype.bindVertices = function() {
  var positionLocation;
  this.use();
  positionLocation = this.gl.getAttribLocation(this.program, "position");
  this.buffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), this.gl.STATIC_DRAW);
  this.gl.enableVertexAttribArray(positionLocation);
  return this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
};

ISFGLProgram.prototype.cleanup = function() {
  this.gl.deleteShader(this.fShader);
  this.gl.deleteShader(this.vShader);
  this.gl.deleteProgram(this.program);
  return this.gl.deleteBuffer(this.buffer);
};

ISFGLProgram.prototype.createShader = function(src, type) {
  var compiled, lastError, shader;
  shader = this.gl.createShader(type);
  this.gl.shaderSource(shader, src);
  this.gl.compileShader(shader);
  compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
  if (!compiled) {
    lastError = this.gl.getShaderInfoLog(shader);
    console.log("Error Compiling Shader ", lastError);
    throw {
      message: lastError,
      type: "shader"
    };
  }
  return shader;
};

ISFGLProgram.prototype.createProgram = function(vShader, fShader) {
  var lastError, linked, program;
  program = this.gl.createProgram();
  this.gl.attachShader(program, vShader);
  this.gl.attachShader(program, fShader);
  this.gl.linkProgram(program);
  linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
  if (!linked) {
    lastError = this.gl.getProgramInfoLog(program);
    console.log("Error in program linking", lastError);
    throw {
      message: lastError,
      type: "program"
    };
  }
  return program;
};

exports.ISFGLProgram = ISFGLProgram;
