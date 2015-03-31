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
