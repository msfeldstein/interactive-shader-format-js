const fs = require('fs');
const MetadataExtractor = require('./MetadataExtractor');
/*

  Uniforms you will need to set, in addition to any inputs specified are
  RENDERSIZE: vec2 rendering size in pixels
  TIME: float time in seconds since rendering started
  PASSINDEX: int index of the current pass being rendered
  See http://vdmx.vidvox.net/blog/isf for more info

*/

const ISFParser = function () {};

ISFParser.prototype.parse = function (rawFragmentShader, rawVertexShader) {
  try {
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
    const endOfMetadata = this.rawFragmentShader.indexOf(metadataString) + metadataString.length + 2;
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
  }
};

ISFParser.prototype.parsePasses = function (passesArray) {
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

ISFParser.prototype.generateShaders = function () {
  this.uniformDefs = '';
  for (var i = 0; i < this.inputs.length; ++i) {
    this.addUniform(this.inputs[i]);
  }

  for (var i = 0; i < this.passes.length; ++i) {
    if (this.passes[i].target) {
      this.addUniform({ NAME: this.passes[i].target, TYPE: 'image' });
    }
  }

  for (const k in this.imports) {
    if (this.imports.hasOwnProperty(k)) {
      this.addUniform({ NAME: k, TYPE: 'image' });
    }
  }

  this.fragmentShader = this.buildFragmentShader();
  this.vertexShader = this.buildVertexShader();
};

ISFParser.prototype.addUniform = function (input) {
  const type = this.inputToType(input.TYPE);
  this.addUniformLine(`uniform ${type} ${input.NAME};`);
  if (type == 'sampler2D') {
    this.addUniformLine(this.samplerUniforms(input));
  }
};

ISFParser.prototype.addUniformLine = function (line) {
  this.uniformDefs += `${line}\n`;
};

ISFParser.prototype.samplerUniforms = function (input) {
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

ISFParser.prototype.buildFragmentShader = function () {
  const main = this.replaceSpecialFunctions(this.rawFragmentMain);
  return ISFParser.fragmentShaderSkeleton.replace('[[uniforms]]', this.uniformDefs).replace('[[main]]', main);
};

ISFParser.prototype.replaceSpecialFunctions = function (source) {
  let regex;

  // IMG_THIS_PIXEL
  regex = /IMG_THIS_PIXEL\((.+?)\)/g;
  source = source.replace(regex, (fullMatch, innerMatch) => `texture2D(${innerMatch}, isf_FragNormCoord)`);

  // IMG_THIS_NORM_PIXEL
  regex = /IMG_THIS_NORM_PIXEL\((.+?)\)/g;
  source = source.replace(regex, (fullMatch, innerMatch) => `texture2D(${innerMatch}, isf_FragNormCoord)`);

  // IMG_PIXEL
  regex = /IMG_PIXEL\((.+?)\)/g;
  source = source.replace(regex, (fullMatch, innerMatch) => {
    const results = innerMatch.split(',');
    const sampler = results[0];
    const coord = results[1];
    return `texture2D(${sampler}, (${coord}) / RENDERSIZE)`;
  });

  // IMG_NORM_PIXEL
  regex = /IMG_NORM_PIXEL\((.+?)\)/g;
  source = source.replace(regex, (fullMatch, innerMatch) => {
    const results = innerMatch.split(',');
    const sampler = results[0];
    const coord = results[1];
    return `VVSAMPLER_2DBYNORM(${sampler}, _${sampler}_imgRect, _${sampler}_imgSize, _${sampler}_flip, ${coord})`;
  });
  return source;
};

ISFParser.prototype.buildVertexShader = function () {
  let functionLines = '\n';
  for (let i = 0; i < this.inputs.length; ++i) {
    const input = this.inputs[i];
    if (input.TYPE == 'image') {
      functionLines += `${this.texCoordFunctions(input)}\n`;
    }
  }
  return ISFParser.vertexShaderSkeleton.replace('[[functions]]', functionLines).replace('[[uniforms]]', this.uniformDefs).replace('[[main]]', this.rawVertexShader);
};

ISFParser.prototype.texCoordFunctions = function (input) {
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

ISFParser.prototype.inferFilterType = function () {
  function any(arr, test) {
    return arr.filter(test).length > 0;
  }
  const isFilter = any(this.inputs, input => input.TYPE == 'image' && input.NAME == 'inputImage');
  const isTransition =
    any(this.inputs, input => input.TYPE == 'image' && input.NAME == 'startImage')
    &&
    any(this.inputs, input => input.TYPE == 'image' && input.NAME == 'endImage')
    &&
    any(this.inputs, input => input.TYPE == 'float' && input.NAME == 'progress');
  if (isFilter) {
    this.type = 'filter';
  } else if (isTransition) {
    this.type = 'transition';
  } else {
    this.type = 'generator';
  }
};

ISFParser.prototype.inferISFVersion = function () {
  let v = 2;
  if (this.metadata.PERSISTENT_BUFFERS ||
      this.rawFragmentShader.indexOf('vv_FragNormCoord') != -1 ||
      this.rawVertexShader.indexOf('vv_vertShaderInit') != -1 ||
      this.rawVertexShader.indexOf('vv_FragNormCoord') != -1) {
    v = 1;
  }
  return v;
};

ISFParser.prototype.inputToType = function (inputType) {
  const type = ISFParser._typeUniformMap[inputType];
  if (!type) throw `Unknown input type [${inputType}]`;
  return type;
};

ISFParser._typeUniformMap = {
  float: 'float',
  image: 'sampler2D',
  bool: 'bool',
  event: 'bool',
  long: 'int',
  color: 'vec4',
  point2D: 'vec2',
};

ISFParser.fragmentShaderSkeleton = fs.readFileSync(`${__dirname}/assets/fragment-shader-skeleton.fs`).toString();
ISFParser.vertexShaderDefault = fs.readFileSync(`${__dirname}/assets/vertex-shader-default.vs`).toString();
ISFParser.vertexShaderSkeleton = fs.readFileSync(`${__dirname}/assets/vertex-shader-skeleton.vs`).toString();

module.exports = ISFParser;
