module.exports = function(rawFragmentShader) {
	// First pull out the comment JSON to get the metadata.
	// This regex (should) match quotes in the form /* */.
	var regex = /\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/;
	var results = regex.exec( rawFragmentShader );

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

	var startIndex = rawFragmentShader.indexOf("/*")
	var endIndex = rawFragmentShader.indexOf("*/")
	return {
		objectValue: metadata,
		stringValue: metadataString,
		startIndex: startIndex,
		endIndex: endIndex
	}
}
