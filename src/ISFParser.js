import MetadataExtractor from './MetadataExtractor';
/*

  Uniforms you will need to set, in addition to any inputs specified are
  RENDERSIZE: vec2 rendering size in pixels
  TIME: float time in seconds since rendering started
  PASSINDEX: int index of the current pass being rendered
  See http://vdmx.vidvox.net/blog/isf for more info

*/

const typeUniformMap = {
  float: 'float',
  image: 'sampler2D',
  bool: 'bool',
  event: 'bool',
  long: 'int',
  color: 'vec4',
  point2D: 'vec2',
};

const ISFParser = function ISFParser() {};

ISFParser.prototype.parse = function parse(rawFragmentShader, rawVertexShader) {
  try {
    this.valid = true;
    this.rawFragmentShader = rawFragmentShader;
    this.rawVertexShader = rawVertexShader || ISFParser.vertexShaderDefault;
    this.error = null;
    const metadataInfo = MetadataExtractor(this.rawFragmentShader);
    const metadata = metadataInfo.objectValue;
    const metadataString = metadataInfo.stringValue;
    this.metadata = metadata;
    this.credit = metadata.CREDIT;
    this.categories = metadata.CATEGORIES;
    this.inputs = metadata.INPUTS;
    this.imports = (metadata.IMPORTED || {});
    this.description = metadata.DESCRIPTION;

    const passesArray = metadata.PASSES || [{}];
    this.passes = this.parsePasses(passesArray);
    const endOfMetadata =
      this.rawFragmentShader.indexOf(metadataString) + metadataString.length + 2;
    this.rawFragmentMain = this.rawFragmentShader.substring(endOfMetadata);
    this.generateShaders();
    this.inferFilterType();
    this.isfVersion = this.inferISFVersion();
  } catch (e) {
    this.valid = false;
    this.error = e;
    this.inputs = [];
    this.categories = [];
    this.credit = '';
    this.errorLine = e.lineNumber;
  }
};

ISFParser.prototype.parsePasses = function parsePasses(passesArray) {
  const passes = [];
  for (let i = 0; i < passesArray.length; ++i) {
    const passDefinition = passesArray[i];
    const pass = { };
    if (passDefinition.TARGET) pass.target = passDefinition.TARGET;
    pass.persistent = !!passDefinition.PERSISTENT;
    pass.width = passDefinition.WIDTH || '$WIDTH';
    pass.height = passDefinition.HEIGHT || '$HEIGHT';
    pass.float = !!passDefinition.FLOAT;
    passes.push(pass);
  }
  return passes;
};

ISFParser.prototype.generateShaders = function generateShaders() {
  this.uniformDefs = '';
  for (let i = 0; i < this.inputs.length; ++i) {
    this.addUniform(this.inputs[i]);
  }

  for (let i = 0; i < this.passes.length; ++i) {
    if (this.passes[i].target) {
      this.addUniform({ NAME: this.passes[i].target, TYPE: 'image' });
    }
  }

  for (const k in this.imports) {
    if ({}.hasOwnProperty.call(this.imports, k)) {
      this.addUniform({ NAME: k, TYPE: 'image' });
    }
  }

  this.fragmentShader = this.buildFragmentShader();
  this.vertexShader = this.buildVertexShader();
};

ISFParser.prototype.addUniform = function addUniform(input) {
  const type = this.inputToType(input.TYPE);
  this.addUniformLine(`uniform ${type} ${input.NAME};`);
  if (type === 'sampler2D') {
    this.addUniformLine(this.samplerUniforms(input));
  }
};

ISFParser.prototype.addUniformLine = function addUniformLine(line) {
  this.uniformDefs += `${line}\n`;
};

ISFParser.prototype.samplerUniforms = function samplerUniforms(input) {
  const name = input.NAME;
  let lines = '';
  lines += `uniform vec4 _${name}_imgRect;\n`;
  lines += `uniform vec2 _${name}_imgSize;\n`;
  lines += `uniform bool _${name}_flip;\n`;
  lines += `varying vec2 _${name}_normTexCoord;\n`;
  lines += `varying vec2 _${name}_texCoord;\n`;
  lines += '\n';
  return lines;
};

ISFParser.prototype.buildFragmentShader = function buildFragmentShader() {
  const main = this.replaceSpecialFunctions(this.rawFragmentMain);
  return ISFParser.fragmentShaderSkeleton.replace('[[uniforms]]', this.uniformDefs).replace('[[main]]', main);
};

ISFParser.prototype.replaceSpecialFunctions = function replaceSpecialFunctions(source) {
  let regex;

  // IMG_THIS_PIXEL
  regex = /IMG_THIS_PIXEL\((.+?)\)/g;
  source = source.replace(regex, (fullMatch, innerMatch) => `texture2D(${innerMatch}, isf_FragNormCoord)`);

  // IMG_THIS_NORM_PIXEL
  regex = /IMG_THIS_NORM_PIXEL\((.+?)\)/g;
  source = source.replace(regex, (fullMatch, innerMatch) => `texture2D(${innerMatch}, isf_FragNormCoord)`);

  // IMG_PIXEL
  regex = /IMG_PIXEL\((.+?)\s?,\s?(.+?\)?\.?.*)\)/g;
  source = source.replace(regex, (fullMatch, sampler, coord) => {
    return `texture2D(${sampler}, (${coord}) / RENDERSIZE)`;
  });

  // IMG_NORM_PIXEL
  regex = /IMG_NORM_PIXEL\((.+?)\s?,\s?(.+?\)?\.?.*)\)/g;
  source = source.replace(regex, (fullMatch, sampler, coord) => {
    return `VVSAMPLER_2DBYNORM(${sampler}, _${sampler}_imgRect, _${sampler}_imgSize, _${sampler}_flip, ${coord})`;
  });

  // IMG_SIZE
  regex = /IMG_SIZE\((.+?)\)/g;
  source = source.replace(regex, (fullMatch, imgName) => {
    return `_${imgName}_imgSize`;
  });
  return source;
};

ISFParser.prototype.buildVertexShader = function buildVertexShader() {
  let functionLines = '\n';
  for (let i = 0; i < this.inputs.length; ++i) {
    const input = this.inputs[i];
    if (input.TYPE === 'image') {
      functionLines += `${this.texCoordFunctions(input)}\n`;
    }
  }
  return ISFParser.vertexShaderSkeleton.replace('[[functions]]', functionLines).replace('[[uniforms]]', this.uniformDefs).replace('[[main]]', this.rawVertexShader);
};

ISFParser.prototype.texCoordFunctions = function texCoordFunctions(input) {
  const name = input.NAME;
  return [
    '_[[name]]_texCoord =',
    '    vec2(((isf_fragCoord.x / _[[name]]_imgSize.x * _[[name]]_imgRect.z) + _[[name]]_imgRect.x), ',
    '          (isf_fragCoord.y / _[[name]]_imgSize.y * _[[name]]_imgRect.w) + _[[name]]_imgRect.y);',
    '',
    '_[[name]]_normTexCoord =',
    '  vec2((((isf_FragNormCoord.x * _[[name]]_imgSize.x) / _[[name]]_imgSize.x * _[[name]]_imgRect.z) + _[[name]]_imgRect.x),',
    '          ((isf_FragNormCoord.y * _[[name]]_imgSize.y) / _[[name]]_imgSize.y * _[[name]]_imgRect.w) + _[[name]]_imgRect.y);',
  ].join('\n').replace(/\[\[name\]\]/g, name);
};

ISFParser.prototype.inferFilterType = function inferFilterType() {
  function any(arr, test) {
    return arr.filter(test).length > 0;
  }
  const isFilter = any(this.inputs, input => input.TYPE === 'image' && input.NAME === 'inputImage');
  const isTransition =
    any(this.inputs, input => input.TYPE === 'image' && input.NAME === 'startImage')
    &&
    any(this.inputs, input => input.TYPE === 'image' && input.NAME === 'endImage')
    &&
    any(this.inputs, input => input.TYPE === 'float' && input.NAME === 'progress');
  if (isFilter) {
    this.type = 'filter';
  } else if (isTransition) {
    this.type = 'transition';
  } else {
    this.type = 'generator';
  }
};

ISFParser.prototype.inferISFVersion = function inferISFVersion() {
  let v = 2;
  if (this.metadata.PERSISTENT_BUFFERS ||
      this.rawFragmentShader.indexOf('vv_FragNormCoord') !== -1 ||
      this.rawVertexShader.indexOf('vv_vertShaderInit') !== -1 ||
      this.rawVertexShader.indexOf('vv_FragNormCoord') !== -1) {
    v = 1;
  }
  return v;
};

ISFParser.prototype.inputToType = function inputToType(inputType) {
  const type = typeUniformMap[inputType];
  if (!type) throw new Error(`Unknown input type [${inputType}]`);
  return type;
};

ISFParser.fragmentShaderSkeleton = `
precision highp float;
precision highp int;

uniform int PASSINDEX;
uniform vec2 RENDERSIZE;
varying vec2 isf_FragNormCoord;
varying vec2 isf_FragCoord;
uniform float TIME;
uniform float TIMEDELTA;
uniform int FRAMEINDEX;
uniform vec4 DATE;

[[uniforms]]

// We don't need 2DRect functions since we control all inputs.  Don't need flip either, but leaving
// for consistency sake.
vec4 VVSAMPLER_2DBYPIXEL(sampler2D sampler, vec4 samplerImgRect, vec2 samplerImgSize, bool samplerFlip, vec2 loc) {
  return (samplerFlip)
    ? texture2D   (sampler,vec2(((loc.x/samplerImgSize.x*samplerImgRect.z)+samplerImgRect.x), (samplerImgRect.w-(loc.y/samplerImgSize.y*samplerImgRect.w)+samplerImgRect.y)))
    : texture2D   (sampler,vec2(((loc.x/samplerImgSize.x*samplerImgRect.z)+samplerImgRect.x), ((loc.y/samplerImgSize.y*samplerImgRect.w)+samplerImgRect.y)));
}
vec4 VVSAMPLER_2DBYNORM(sampler2D sampler, vec4 samplerImgRect, vec2 samplerImgSize, bool samplerFlip, vec2 normLoc)  {
  vec4    returnMe = VVSAMPLER_2DBYPIXEL(   sampler,samplerImgRect,samplerImgSize,samplerFlip,vec2(normLoc.x*samplerImgSize.x, normLoc.y*samplerImgSize.y));
  return returnMe;
}

[[main]]

`;

ISFParser.vertexShaderDefault = `
void main() {
  isf_vertShaderInit();
}
`;
ISFParser.vertexShaderSkeleton = `
precision highp float;
precision highp int;
void isf_vertShaderInit();

attribute vec2 isf_position; // -1..1

uniform int     PASSINDEX;
uniform vec2    RENDERSIZE;
varying vec2    isf_FragNormCoord; // 0..1
vec2    isf_fragCoord; // Pixel Space

[[uniforms]]

[[main]]
void isf_vertShaderInit(void)  {
gl_Position = vec4( isf_position, 0.0, 1.0 );
  isf_FragNormCoord = vec2((gl_Position.x+1.0)/2.0, (gl_Position.y+1.0)/2.0);
  isf_fragCoord = floor(isf_FragNormCoord * RENDERSIZE);
  [[functions]]
}
`;

export default ISFParser;
