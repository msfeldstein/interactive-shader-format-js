function ISFGLProgram(gl, vs, fs) {
  this.gl = gl;
  this.vShader = this.createShader(vs, this.gl.VERTEX_SHADER);
  this.fShader = this.createShader(fs, this.gl.FRAGMENT_SHADER);
  this.program = this.createProgram(this.vShader, this.fShader);
  this.locations = {};
}

ISFGLProgram.prototype.use = function glProgramUse() {
  this.gl.useProgram(this.program);
};

ISFGLProgram.prototype.getUniformLocation = function getUniformLocation(name) {
  return this.gl.getUniformLocation(this.program, name);
};

ISFGLProgram.prototype.bindVertices = function bindVertices() {
  this.use();
  const positionLocation = this.gl.getAttribLocation(this.program, 'isf_position');
  this.buffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
  const vertexArray = new Float32Array(
    [-1.0, -1.0, 1.0,
      -1.0, -1.0, 1.0,
      -1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0]);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, vertexArray, this.gl.STATIC_DRAW);
  this.gl.enableVertexAttribArray(positionLocation);
  this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
};

ISFGLProgram.prototype.cleanup = function cleanup() {
  this.gl.deleteShader(this.fShader);
  this.gl.deleteShader(this.vShader);
  this.gl.deleteProgram(this.program);
  this.gl.deleteBuffer(this.buffer);
};

ISFGLProgram.prototype.createShader = function createShader(src, type) {
  const shader = this.gl.createShader(type);
  this.gl.shaderSource(shader, src);
  this.gl.compileShader(shader);
  const compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
  if (!compiled) {
    const lastError = this.gl.getShaderInfoLog(shader);
    console.log('Error Compiling Shader ', lastError);
    throw new Error({
      message: lastError,
      type: 'shader',
    });
  }
  return shader;
};

ISFGLProgram.prototype.createProgram = function createProgram(vShader, fShader) {
  const program = this.gl.createProgram();
  this.gl.attachShader(program, vShader);
  this.gl.attachShader(program, fShader);
  this.gl.linkProgram(program);
  const linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
  if (!linked) {
    const lastError = this.gl.getProgramInfoLog(program);
    console.log('Error in program linking', lastError);
    throw new Error({
      message: lastError,
      type: 'program',
    });
  }
  return program;
};


export default ISFGLProgram;
