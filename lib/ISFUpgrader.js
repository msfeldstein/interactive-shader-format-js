var MetadataExtractor = require('./MetadataExtractor')
module.exports = function(fragShader) {
	var metadataInfo = MetadataExtractor(fragShader)
	var meta = metadataInfo.objectValue
	var persistentBufferNames = meta.PERSISTENT_BUFFERS || []
	meta.PASSES.forEach(function(pass) {
		if (persistentBufferNames.indexOf(pass.TARGET) != -1) pass.persistent = true
	})
	delete meta.PERSISTENT_BUFFERS
	fragShader = fragShader.replace(metadataInfo.stringValue, JSON.stringify(meta, null, 2))
	fragShader = fragShader.replace(/vv_FragNormCoord/g, 'isf_FragNormCoord')
	return fragShader
}
