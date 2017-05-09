module.exports = function (rawFragmentShader) {
	// First pull out the comment JSON to get the metadata.
	// This regex (should) match quotes in the form /* */.
  const regex = /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/;
  const results = regex.exec(rawFragmentShader);

  if (!results) {
    throw 'There is no metadata here.';
  }

  let metadataString = results[0];
  metadataString = metadataString.substring(1, metadataString.length - 1);
  let metadata;
  try {
    metadata = JSON.parse(metadataString);
  } catch (e) {
    throw 'Something is wrong with your metadata';
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
