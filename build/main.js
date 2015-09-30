(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var ISFTexture = require("./ISFTexture.js").ISFTexture;

function ISFBuffer(pass, contextState) {
  this.contextState = contextState;
  this.gl = this.contextState.gl;
  this.persistent = pass.persistent;
  this.float = pass.float;
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

exports.ISFBuffer = ISFBuffer;

},{"./ISFTexture.js":6}],2:[function(require,module,exports){
function ISFGLProgram(gl, vs, fs) {
  this.gl = gl;
  this.vShader = this.createShader(vs, this.gl.VERTEX_SHADER);
  this.fShader = this.createShader(fs, this.gl.FRAGMENT_SHADER);
  this.program = this.createProgram(this.vShader, this.fShader);
  this.locations = {};
}

ISFGLProgram.prototype.use = function() {
  this.gl.useProgram(this.program);
};

ISFGLProgram.prototype.getUniformLocation = function(name) {
  return this.gl.getUniformLocation(this.program, name);
};

ISFGLProgram.prototype.setUniform1i = function(uniformName, value) {
  if (locations[uniformName] == null) {
    locations[uniformName] = this.getUniformLocation(this.program, uniformName);
  }
  this.gl.uniform1i(this.paintProgram.texLocation, target.textureUnit);
};

ISFGLProgram.prototype.bindVertices = function() {
  this.use();
  var positionLocation = this.gl.getAttribLocation(this.program, "position");
  this.buffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), this.gl.STATIC_DRAW);
  this.gl.enableVertexAttribArray(positionLocation);
  this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
};

ISFGLProgram.prototype.cleanup = function() {
  this.gl.deleteShader(this.fShader);
  this.gl.deleteShader(this.vShader);
  this.gl.deleteProgram(this.program);
  this.gl.deleteBuffer(this.buffer);
};

ISFGLProgram.prototype.createShader = function(src, type) {
  var shader = this.gl.createShader(type);
  this.gl.shaderSource(shader, src);
  this.gl.compileShader(shader);
  var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
  if (!compiled) {
    var lastError = this.gl.getShaderInfoLog(shader);
    console.log("Error Compiling Shader ", lastError);
    throw {
      message: lastError,
      type: "shader"
    };
  }
  return shader;
};

ISFGLProgram.prototype.createProgram = function(vShader, fShader) {
  var program = this.gl.createProgram();
  this.gl.attachShader(program, vShader);
  this.gl.attachShader(program, fShader);
  this.gl.linkProgram(program);
  var linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
  if (!linked) {
    var lastError = this.gl.getProgramInfoLog(program);
    console.log("Error in program linking", lastError);
    throw {
      message: lastError,
      type: "program"
    };
  }
  return program;
};

exports.ISFGLProgram = ISFGLProgram;

},{}],3:[function(require,module,exports){
var ISFGLState = function(gl) {
  this.gl = gl;
  this.textureIndex = 0;
}

ISFGLState.prototype.newTextureIndex = function() {
  var i = this.textureIndex;
  this.textureIndex += 1;
  return i;
}

ISFGLState.prototype.reset = function() {
  this.textureIndex = 0;
}

exports.ISFGLState = ISFGLState;

},{}],4:[function(require,module,exports){

/*

  Uniforms you will need to set, in addition to any inputs specified are
  RENDERSIZE: vec2 rendering size in pixels
  TIME: float time in seconds since rendering started
  PASSINDEX: int index of the current pass being rendered
  See http://vdmx.vidvox.net/blog/isf for more info

*/

var ISFParser = function () {};

ISFParser.prototype.parse = function ( rawFragmentShader, rawVertexShader ) {
  try {
    this.rawFragmentShader = rawFragmentShader;
    this.rawVertexShader = rawVertexShader || ISFParser.vertexShaderDefault;
    this.error = null;
    // First pull out the comment JSON to get the metadata.
    // This regex (should) match quotes in the form /* */.
    var regex = /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/;
    var results = regex.exec( this.rawFragmentShader );

    if ( !results ) {
      throw "There is no metadata here."
    }

    var metadataString = results[0];
    metadataString = metadataString.substring(1, metadataString.length - 1);
    var metadata;
    try {
      metadata = JSON.parse(metadataString);
    } catch (e) {
      throw "Something is wrong with your metadata";
    }
    this.credit = metadata.CREDIT;
    this.categories = metadata.CATEGORIES;
    this.inputs = metadata.INPUTS;
    this.imports = ( metadata.IMPORTED || {} );
    this.description = metadata.DESCRIPTION
    var persistentArray = metadata.PERSISTENT_BUFFERS || [];
    if ( !(persistentArray instanceof Array) ) {
      throw "PERSISTENT_BUFFERS must be an array of strings";
    }
    var passesArray = metadata.PASSES || [ {} ];
    this.passes = this.parsePasses(passesArray, persistentArray);
    var endOfMetadata = this.rawFragmentShader.indexOf(metadataString) + metadataString.length + 2;
    this.rawFragmentMain = this.rawFragmentShader.substring(endOfMetadata);
    this.generateShaders();
  } catch (e) {
    this.valid = false;
    this.error = e;
    this.inputs = [];
    this.categories = [];
    this.credit = "";
  }
}

ISFParser.prototype.parsePasses = function ( passesArray, persistentArray ) {
  var passes = [];
  for ( var i = 0; i < passesArray.length; ++i ) {
    var passDefinition = passesArray[ i ];
    var pass = { };
    if ( passDefinition.TARGET ) pass.target = passDefinition.TARGET;
    pass.persistent = persistentArray.indexOf( passDefinition.TARGET ) > -1;
    pass.width = passDefinition.WIDTH || "$WIDTH";
    pass.height = passDefinition.HEIGHT || "$HEIGHT";
    pass.float = !!passDefinition.FLOAT;
    passes.push( pass );
  }
  return passes;
}

ISFParser.prototype.generateShaders = function () {
  this.uniformDefs = "";
  for ( var i = 0; i < this.inputs.length; ++i ) {
    this.addUniform( this.inputs[ i ] );
  }

  for ( var i = 0; i < this.passes.length; ++i ) {
    if ( this.passes[i].target ) {
      this.addUniform( {NAME: this.passes[i].target, TYPE: "image"} );
    }
  }

  for ( var k in this.imports ) {
    if ( this.imports.hasOwnProperty(k) ) {
      this.addUniform( {NAME: k, TYPE: "image"} )
    }
  }

  this.fragmentShader = this.buildFragmentShader();
  this.vertexShader = this.buildVertexShader();
}

ISFParser.prototype.addUniform = function ( input ) {
  var type = this.inputToType(input.TYPE);
  this.addUniformLine( "uniform " + type + " " + input.NAME + ";" );
  if ( type == "sampler2D" ) {
    this.addUniformLine( this.samplerUniforms(input) );
  }
}

ISFParser.prototype.addUniformLine = function ( line ) {
  this.uniformDefs += line + "\n";
}

ISFParser.prototype.samplerUniforms = function ( input ) {
  var name = input.NAME;
  var lines = "";
  lines += "uniform vec4 _" + name + "_imgRect;\n";
  lines += "uniform vec2 _" + name + "_imgSize;\n";
  lines += "uniform bool _" + name + "_flip;\n";
  lines += "varying vec2 _" + name + "_normTexCoord;\n";
  lines += "varying vec2 _" + name + "_texCoord;\n";
  lines += "\n";
  return lines;
}

ISFParser.prototype.buildFragmentShader = function () {
  var main = this.replaceSpecialFunctions( this.rawFragmentMain );
  return ISFParser.fragmentShaderSkeleton.replace("[[uniforms]]", this.uniformDefs).replace("[[main]]", main);
}

ISFParser.prototype.replaceSpecialFunctions = function ( source ) {
  var regex;

  // IMG_THIS_PIXEL
  regex = /IMG_THIS_PIXEL\(([a-zA-Z]+)\)/g;
  source = source.replace( regex, function( fullMatch, innerMatch ) {
    return "texture2D(" + innerMatch + ", vv_FragNormCoord)";
  });

  // IMG_THIS_NORM_PIXEL
  regex = /IMG_THIS_NORM_PIXEL\((.+?)\)/g;
  source = source.replace( regex, function( fullMatch, innerMatch ) {
    return "texture2D(" + innerMatch + ", vv_FragNormCoord)";
  });

  // IMG_PIXEL
  regex = /IMG_PIXEL\((.+?)\)/g;
  source = source.replace( regex, function( fullMatch, innerMatch ) {
    var results = innerMatch.split(",");
    var sampler = results[0];
    var coord = results[1];
    return "texture2D(" + sampler + ", (" + coord + ") / RENDERSIZE)";
  });

  // IMG_NORM_PIXEL
  regex = /IMG_NORM_PIXEL\((.+?)\)/g
  source = source.replace(regex, function( fullMatch, innerMatch ) {
    var results = innerMatch.split(",");
    var sampler = results[0];
    var coord = results[1];
    return "VVSAMPLER_2DBYNORM(" + sampler + ", _" + sampler + "_imgRect, _" + sampler + "_imgSize, _" + sampler + "_flip, " + coord + ")";
  });
  return source;
}

ISFParser.prototype.buildVertexShader = function () {
  var functionLines = "\n";
  for ( var i = 0; i < this.inputs.length; ++i ) {
    var input = this.inputs[i];
    if ( input.TYPE == "image" ) {
      functionLines += this.texCoordFunctions( input ) + "\n";
    }
  }
  return ISFParser.vertexShaderSkeleton.replace("[[functions]]", functionLines).replace("[[uniforms]]", this.uniformDefs).replace("[[main]]", this.rawVertexShader)
}

ISFParser.prototype.texCoordFunctions = function ( input ) {
  var name = input.NAME;
  return [
    "_[[name]]_texCoord =",
    "    vec2(((vv_fragCoord.x / _[[name]]_imgSize.x * _[[name]]_imgRect.z) + _[[name]]_imgRect.x), ",
    "          (vv_fragCoord.y / _[[name]]_imgSize.y * _[[name]]_imgRect.w) + _[[name]]_imgRect.y);",
    "",
    "_[[name]]_normTexCoord =",
    "  vec2((((vv_FragNormCoord.x * _[[name]]_imgSize.x) / _[[name]]_imgSize.x * _[[name]]_imgRect.z) + _[[name]]_imgRect.x),",
    "          ((vv_FragNormCoord.y * _[[name]]_imgSize.y) / _[[name]]_imgSize.y * _[[name]]_imgRect.w) + _[[name]]_imgRect.y);"
  ].join("\n").replace(/\[\[name\]\]/g, name);
}

ISFParser.prototype.inputToType = function ( inputType ) {
  var type = ISFParser._typeUniformMap[inputType];
  if ( !type )  throw "Unknown input type [" + inputType + "]";
  return type;
}

ISFParser._typeUniformMap = {
  "float": "float",
  "image": "sampler2D",
  "bool": "bool",
  "event": "bool",
  "long": "int",
  "color": "vec4",
  "point2D": "vec2"
};

ISFParser.fragmentShaderSkeleton = [
    "precision highp float;",
    "precision highp int;",
    "",
    "uniform int PASSINDEX;",
    "uniform vec2 RENDERSIZE;",
    "varying vec2 vv_FragNormCoord;",
    "varying vec2 vv_FragCoord;",
    "uniform float TIME;",
    "",
    "[[uniforms]]",
    "",
    "// We don't need 2DRect functions since we control all inputs.  Don't need flip either, but leaving",
    "// for consistency sake.",
    "vec4 VVSAMPLER_2DBYPIXEL(sampler2D sampler, vec4 samplerImgRect, vec2 samplerImgSize, bool samplerFlip, vec2 loc) {",
    "  return (samplerFlip)",
    "    ? texture2D   (sampler,vec2(((loc.x/samplerImgSize.x*samplerImgRect.z)+samplerImgRect.x), (samplerImgRect.w-(loc.y/samplerImgSize.y*samplerImgRect.w)+samplerImgRect.y)))",
    "    : texture2D   (sampler,vec2(((loc.x/samplerImgSize.x*samplerImgRect.z)+samplerImgRect.x), ((loc.y/samplerImgSize.y*samplerImgRect.w)+samplerImgRect.y)));",
    "}",
    "vec4 VVSAMPLER_2DBYNORM(sampler2D sampler, vec4 samplerImgRect, vec2 samplerImgSize, bool samplerFlip, vec2 normLoc)  {",
    "  vec4    returnMe = VVSAMPLER_2DBYPIXEL(   sampler,samplerImgRect,samplerImgSize,samplerFlip,vec2(normLoc.x*samplerImgSize.x, normLoc.y*samplerImgSize.y));",
    "  return returnMe;",
    "}",
    "",
    "[[main]]",
    ""
].join("\n");

ISFParser.vertexShaderDefault = [
  "void main() {",
  "  vv_vertShaderInit();",
  "}"
].join("\n");

ISFParser.vertexShaderSkeleton = [
    "precision highp float;",
    "precision highp int;",
    "void vv_vertShaderInit();",
    "",
    "attribute vec2 position; // -1..1",
    "",
    "uniform int     PASSINDEX;",
    "uniform vec2    RENDERSIZE;",
    "varying vec2    vv_FragNormCoord; // 0..1",
    "vec2    vv_fragCoord; // Pixel Space",
    "",
    "[[uniforms]]",
    "",
    "[[main]]",
    "void vv_vertShaderInit(void)  {",
    "gl_Position = vec4( position, 0.0, 1.0 );",
    "  vv_FragNormCoord = vec2((gl_Position.x+1.0)/2.0, (gl_Position.y+1.0)/2.0);",
    "  vv_fragCoord = floor(vv_FragNormCoord * RENDERSIZE);",
    "  [[functions]]",
    "}",
    ""
].join("\n");

exports.ISFParser = ISFParser;

},{}],5:[function(require,module,exports){
var ISFGLState = require("./ISFGLState.js").ISFGLState;
var ISFGLProgram = require("./ISFGLProgram.js").ISFGLProgram;
var ISFBuffer = require("./ISFBuffer.js").ISFBuffer;
var ISFParser = require("./ISFParser.js").ISFParser;
var ISFTexture = require("./ISFTexture.js").ISFTexture;

var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

function ISFRenderer(gl) {
  this.gl = gl;
  this.uniforms = [];
  this.pushUniform = bind(this.pushUniform, this);
  this.pushUniforms = bind(this.pushUniforms, this);
  this.pushTextures = bind(this.pushTextures, this);
  this.setupGL = bind(this.setupGL, this);
  this.initUniforms = bind(this.initUniforms, this);
  this.contextState = new ISFGLState(this.gl);
  this.setupPaintToScreen();
  this.startTime = Date.now();
}

ISFRenderer.prototype.loadSource = function(fragmentISF, vertexISFOpt) {
  var parser = new ISFParser()
  parser.parse(fragmentISF, vertexISFOpt);
  this.sourceChanged(parser.fragmentShader, parser.vertexShader, parser);
}

ISFRenderer.prototype.sourceChanged = function(fragmentShader, vertexShader, model) {
  this.fragmentShader = fragmentShader;
  this.vertexShader = vertexShader;
  this.model = model;
  this.setupGL();
  this.initUniforms();
  for (var i = 0; i < model.inputs.length; i++) {
    var input = model.inputs[i];
    if (input.DEFAULT !== undefined) {
      this.setValue(input.NAME, input.DEFAULT);
    }
  }
};

ISFRenderer.prototype.initUniforms = function() {
  this.uniforms = this.findUniforms(this.fragmentShader);
  var inputs = this.model.inputs;
  for (var i = 0; i < inputs.length; ++i) {
    var input = inputs[i];
    var uniform = this.uniforms[input.NAME];
    if (!uniform) {
      continue;
    }
    uniform.value = this.model[input.NAME];
    if (uniform.type === 't') {
      uniform.texture = new ISFTexture({}, this.contextState);
    }
  }
  this.pushTextures();
};

ISFRenderer.prototype.setValue = function(name, value) {
  var uniform = this.uniforms[name];
  if (!uniform) {
    console.error("No uniform named " + name);
    return;
  }
  uniform.value = value;
  if (uniform.type === 't') {
    uniform.textureLoaded = false;
  }
  this.pushUniform(uniform);
};

ISFRenderer.prototype.setNormalizedValue = function(name, normalizedValue) {
  var uniform = this.uniforms[name];
  var inputs = this.model.inputs;
  var input = null;
  for (var i = 0; i < inputs.length; i++) {
    var thisInput = inputs[i];
    if (thisInput.NAME == name) {
      input = thisInput;
      break;
    }
  }
  if (input && input.MIN !== undefined && input.MAX !== undefined) {
    this.setValue(name, input.MIN + (input.MAX - input.MIN) * normalizedValue);
  } else {
    console.log("Trying to set normalized value without MIN and MAX input", name, input);
  }
}

ISFRenderer.prototype.setupPaintToScreen = function() {
  this.paintProgram = new ISFGLProgram(this.gl, this.basicVertexShader, this.basicFragmentShader);
  return this.paintProgram.bindVertices();
};

ISFRenderer.prototype.setupGL = function() {
  this.cleanup();
  this.program = new ISFGLProgram(this.gl, this.vertexShader, this.fragmentShader);
  this.program.bindVertices();
  this.generatePersistentBuffers();
};

ISFRenderer.prototype.generatePersistentBuffers = function() {
  this.renderBuffers = [];
  var passes = this.model.passes;
  for (var i = 0; i < passes.length; ++i) {
    var pass = passes[i];
    var buffer = new ISFBuffer(pass, this.contextState);
    pass.buffer = buffer;
    this.renderBuffers.push(buffer);
  }
};

ISFRenderer.prototype.paintToScreen = function(destination, target) {
  this.paintProgram.use();
  this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  this.gl.viewport(0, 0, destination.width, destination.height);
  var loc = this.paintProgram.getUniformLocation("tex");
  target.readTexture().bind(loc);
  this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  this.program.use();
};

ISFRenderer.prototype.pushTextures = function() {
  for (var i = 0; i < this.uniforms.length; ++i) {
    var uniform = this.uniforms[i];
    if (this.uniforms.hasOwnProperty(name)) {
      if (uniform.type == 't') {
        this.pushTexture(uniform);
      }
    }
  }
};

ISFRenderer.prototype.pushTexture = function(uniform) {
  if (!uniform.value) {
    return;
  }
  if (uniform.value.tagName != "CANVAS" && !uniform.value.complete && uniform.value.readyState !== 4) {
    return;
  }
  var loc = this.program.getUniformLocation(uniform.name);
  uniform.texture.bind(loc);
  this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, uniform.value);
  if (!uniform.textureLoaded) {
    var img = uniform.value;
    uniform.textureLoaded = true;
    var w = img.naturalWidth || img.width || img.videoWidth;
    var h = img.naturalHeight || img.height || img.videoHeight;
    this.setValue("_" + uniform.name + "_imgSize", [w, h]);
    this.setValue("_" + uniform.name + "_imgRect", [0, 0, 1, 1]);
    return this.setValue("_" + uniform.name + "_flip", false);
  }
};

ISFRenderer.prototype.pushUniforms = function() {
  for (var name in this.uniforms) {
    var uniform = this.uniforms[name];
    if (this.uniforms.hasOwnProperty(name)) {
      this.pushUniform(value);
    }
  }
};

ISFRenderer.prototype.pushUniform = function(uniform) {
  var loc = this.program.getUniformLocation(uniform.name);
  if (loc !== -1) {
    if (uniform.type === 't') {
      return this.pushTexture(uniform);
    } else {
      var v = uniform.value;
      switch (uniform.type) {
        case 'f':
          return this.gl.uniform1f(loc, v);
        case 'v2':
          return this.gl.uniform2f(loc, v[0], v[1]);
        case 'v3':
          return this.gl.uniform3f(loc, v[0], v[1], v[2]);
        case 'v4':
          return this.gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
        case 'i':
          return this.gl.uniform1i(loc, v);
        case 'color':
          return this.gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
        default:
          return console.log("Unknown type for uniform setting " + uniform.type, uniform);
      }
    }
  }
};

ISFRenderer.prototype.findUniforms = function(shader) {
  var lines = shader.split("\n");
  var uniforms = {
    TIME: 0,
    PASSINDEX: 0,
    RENDERSIZE: [0, 0]
  };
  var len = lines.length
  for (var i = 0; i < len; ++i) {
    var line = lines[i];
    if (line.indexOf("uniform") === 0) {
      var tokens = line.split(" ");
      var name = tokens[2].substring(0, tokens[2].length - 1);
      var uniform = this.typeToUniform(tokens[1]);
      uniform.name = name;
      uniforms[name] = uniform;
    }
  }
  return uniforms;
};

ISFRenderer.prototype.typeToUniform = function(type) {
  switch (type) {
    case "float":
      return {
        type: "f",
        value: 0
      };
    case "vec2":
      return {
        type: "v2",
        value: [0, 0]
      };
    case "vec3":
      return {
        type: "v3",
        value: [0, 0, 0]
      };
    case "vec4":
      return {
        type: "v4",
        value: [0, 0, 0, 0]
      };
    case "bool":
      return {
        type: "i",
        value: 0
      };
    case "int":
      return {
        type: "i",
        value: 0
      };
    case "color":
      return {
        type: "v4",
        value: [0, 0, 0, 0]
      };
    case "point2D":
      return {
        type: "v2",
        value: [0, 0],
        isPoint: true
      };
    case "sampler2D":
      return {
        type: "t",
        value: {
          complete: false,
          readyState: 0
        },
        texture: null,
        textureUnit: null
      };
    default:
      throw "Unknown uniform type in ISFRenderer.typeToUniform: " + type;
  }
};

ISFRenderer.prototype.draw = function(destination) {
  this.contextState.reset();
  this.program.use();
  this.setValue("TIME", (Date.now() - this.startTime) / 1000);
  var buffers = this.renderBuffers;
  for (var i = 0; i < buffers.length; ++i) {
    var buffer = buffers[i];
    var readTexture = buffer.readTexture();
    var loc = this.program.getUniformLocation(buffer.name);
    readTexture.bind(loc);
    if (buffer.name) {
      this.setValue("_" + buffer.name + "_imgSize", [buffer.width, buffer.height]);
      this.setValue("_" + buffer.name + "_imgRect", [0, 0, 1, 1]);
      this.setValue("_" + buffer.name + "_flip", false);
    }
  }
  var lastTarget = null;
  var passes = this.model.passes;
  for (var i = 0; i < passes.length; ++i) {
    var pass = passes[i];
    this.setValue("PASSINDEX", i);
    var buffer = pass.buffer;
    if (pass.target) {
      var w = this.evaluateSize(destination, pass.width);
      var h = this.evaluateSize(destination, pass.height);
      buffer.setSize(w, h);
      var writeTexture = buffer.writeTexture();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buffer.fbo);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, writeTexture.texture, 0);
      this.setValue("RENDERSIZE", [buffer.width, buffer.height]);
      lastTarget = buffer;
      this.gl.viewport(0, 0, w, h);
    } else {
      var renderWidth = destination.width;
      var renderHeight = destination.height;
      buffer.setSize(renderWidth, renderHeight);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.setValue("RENDERSIZE", [renderWidth, renderHeight]);
      lastTarget = null;
      this.gl.viewport(0, 0, renderWidth, renderHeight);
    }
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
  var buffers = this.renderBuffers;
  for (var i = 0; i < buffers.length; ++i) {
    buffers[i].flip();
  }
  if (lastTarget) {
    return this.paintToScreen(destination, lastTarget);
  }
};

ISFRenderer.prototype.evaluateSize = function(destination, formula) {
  formula = formula + "";
  var s = formula.replace("$WIDTH", destination.offsetWidth).replace("$HEIGHT", destination.offsetHeight);
  for (var name in this.uniforms) {
    var uniform = this.uniforms[name];
    s = s.replace("$" + name, uniform.value);
  }
  return eval(s);
};

ISFRenderer.prototype.cleanup = function() {
  this.contextState.reset();
  if (this.renderBuffers) {
    for (var i = 0; i < this.renderBuffers.length; ++i) {
      this.renderBuffers[i].destroy();
    }
  }
};

ISFRenderer.prototype.basicVertexShader = "precision mediump float;\nprecision mediump int;\nattribute vec2 position; // -1..1\nvarying vec2 texCoord;\n\nvoid main(void) {\n  // Since webgl doesn't support ftransform, we do this by hand.\n  gl_Position = vec4(position, 0, 1);\n  texCoord = position;\n}\n";

ISFRenderer.prototype.basicFragmentShader = "precision mediump float;\nuniform sampler2D tex;\nvarying vec2 texCoord;\nvoid main()\n{\n  gl_FragColor = texture2D(tex, texCoord * 0.5 + 0.5);\n  //gl_FragColor = vec4(texCoord.x);\n}";

exports.ISFRenderer = ISFRenderer;

},{"./ISFBuffer.js":1,"./ISFGLProgram.js":2,"./ISFGLState.js":3,"./ISFParser.js":4,"./ISFTexture.js":6}],6:[function(require,module,exports){
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
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
  this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
  this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
  this.gl.bindTexture(this.gl.TEXTURE_2D, null);
}

ISFTexture.prototype.bind = function(location) {
  if (location == null) {
    location = -1;
  }
  var newTexUnit = this.contextState.newTextureIndex();
  this.gl.activeTexture(this.gl.TEXTURE0 + newTexUnit);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  if (location !== -1) {
    this.gl.uniform1i(location, newTexUnit);
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

},{}],7:[function(require,module,exports){
exports.ISFRenderer = require("./lib/ISFRenderer.js").ISFRenderer;
exports.ISFParser = require("./lib/ISFParser.js").ISFParser;

},{"./lib/ISFParser.js":4,"./lib/ISFRenderer.js":5}]},{},[7]);
