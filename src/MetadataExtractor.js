module.exports = function MetadataExtractor(rawFragmentShader) {
  // First pull out the comment JSON to get the metadata.
  // This regex (should) match quotes in the form /* */.
  const regex = /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/;
  const results = regex.exec(rawFragmentShader);

  if (!results) {
    throw new Error('There is no metadata here.');
  }

  let metadataString = results[0];
  metadataString = metadataString.substring(1, metadataString.length - 1);
  let metadata;
  try {
    metadata = JSON.parse(metadataString);
  } catch (e) {
    const tokens = e.message.split(' ');
    const position = parseInt(tokens[tokens.length - 1], 10);
    let lineNumber = 1;
    for (let i = 0; i < position; i++) {
      if (metadataString[i] === '\n') {
        lineNumber++;
      }
    }
    const lineError = new Error('Something is wrong with your metadata at position ' + position + ' and line ' + lineNumber);
    lineError.lineNumber = lineNumber;
    throw lineError;
  }

  const startIndex = rawFragmentShader.indexOf('/*');
  const endIndex = rawFragmentShader.indexOf('*/');
  return {
    objectValue: metadata,
    stringValue: metadataString,
    startIndex,
    endIndex,
  };
};
