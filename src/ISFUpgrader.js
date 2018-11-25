import MetadataExtractor from './MetadataExtractor';

const ConvertFragment = function ConvertFragment(fragShader) {
  const metadataInfo = MetadataExtractor(fragShader);
  const meta = metadataInfo.objectValue;
  const persistentBufferNames = meta.PERSISTENT_BUFFERS || [];
  if (meta.PASSES) {
    meta.PASSES.forEach((pass) => {
      if (persistentBufferNames.indexOf(pass.TARGET) !== -1) pass.persistent = true;
    });
  }
  delete meta.PERSISTENT_BUFFERS;
  fragShader = fragShader.replace(metadataInfo.stringValue, JSON.stringify(meta, null, 2));
  fragShader = fragShader.replace(/vv_FragNormCoord/g, 'isf_FragNormCoord');
  return fragShader;
};

const ConvertVertex = function ConvertVertex(vertShader) {
  vertShader = vertShader.replace(/vv_vertShaderInit/g, 'isf_vertShaderInit');
  vertShader = vertShader.replace(/vv_FragNormCoord/g, 'isf_FragNormCoord');
  return vertShader;
};

export default {
  convertFragment: ConvertFragment,
  convertVertex: ConvertVertex,
};
