var fs = require('fs')
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
    this.metadata = metadata;
    this.credit = metadata.CREDIT;
    this.categories = metadata.CATEGORIES;
    this.inputs = metadata.INPUTS;
    this.imports = ( metadata.IMPORTED || {} );
    this.description = metadata.DESCRIPTION

    var passesArray = metadata.PASSES || [ {} ];
    this.passes = this.parsePasses(passesArray);
    var endOfMetadata = this.rawFragmentShader.indexOf(metadataString) + metadataString.length + 2;
    this.rawFragmentMain = this.rawFragmentShader.substring(endOfMetadata);
    this.generateShaders();
    this.inferFilterType();
  } catch (e) {
    this.valid = false;
    this.error = e;
    this.inputs = [];
    this.categories = [];
    this.credit = "";
  }
}

ISFParser.prototype.parsePasses = function ( passesArray ) {
  var passes = [];
  for ( var i = 0; i < passesArray.length; ++i ) {
    var passDefinition = passesArray[ i ];
    var pass = { };
    if ( passDefinition.TARGET ) pass.target = passDefinition.TARGET;
    pass.persistent = !!passDefinition.PERSISTENT
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
  regex = /IMG_THIS_PIXEL\((.+?)\)/g;
  source = source.replace( regex, function( fullMatch, innerMatch ) {
    return "texture2D(" + innerMatch + ", isf_FragNormCoord)";
  });

  // IMG_THIS_NORM_PIXEL
  regex = /IMG_THIS_NORM_PIXEL\((.+?)\)/g;
  source = source.replace( regex, function( fullMatch, innerMatch ) {
    return "texture2D(" + innerMatch + ", isf_FragNormCoord)";
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
    "    vec2(((isf_fragCoord.x / _[[name]]_imgSize.x * _[[name]]_imgRect.z) + _[[name]]_imgRect.x), ",
    "          (isf_fragCoord.y / _[[name]]_imgSize.y * _[[name]]_imgRect.w) + _[[name]]_imgRect.y);",
    "",
    "_[[name]]_normTexCoord =",
    "  vec2((((isf_FragNormCoord.x * _[[name]]_imgSize.x) / _[[name]]_imgSize.x * _[[name]]_imgRect.z) + _[[name]]_imgRect.x),",
    "          ((isf_FragNormCoord.y * _[[name]]_imgSize.y) / _[[name]]_imgSize.y * _[[name]]_imgRect.w) + _[[name]]_imgRect.y);"
  ].join("\n").replace(/\[\[name\]\]/g, name);
}

ISFParser.prototype.inferFilterType = function() {
  function any(arr, test) {
    return arr.filter(test).length > 0
  }
  var isFilter = any(this.inputs, function(input) {
    return input.TYPE == 'image' && input.NAME == 'inputImage';
  });
  var isTransition =
    any(this.inputs, function(input) {
      return input.TYPE == 'image' && input.NAME == 'startImage';
    })
    &&
    any(this.inputs, function(input) {
      return input.TYPE == 'image' && input.NAME == 'endImage';
    })
    &&
    any(this.inputs, function(input) {
      return input.TYPE == 'float' && input.NAME == 'progress';
    })
  if (isFilter) {
    this.type = 'filter';
  } else if (isTransition) {
    this.type = 'transition'
  } else {
    this.type = 'generator';
  }
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

ISFParser.fragmentShaderSkeleton = fs.readFileSync('./lib/assets/fragment-shader-skeleton.fs').toString()
ISFParser.vertexShaderDefault = fs.readFileSync('./lib/assets/vertex-shader-default.vs').toString()
ISFParser.vertexShaderSkeleton =  fs.readFileSync('./lib/assets/vertex-shader-skeleton.vs').toString()

module.exports = ISFParser;
