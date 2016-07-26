/*{
	"CREDIT": "by no one",
	"DESCRIPTION": "Invert",
	"CATEGORIES": [],
	"INPUTS": [
		{
			"TYPE": "image",
			"NAME": "inputImage"
		}
	]
}*/

void main() {
	gl_FragColor = vec4(1.0, 1.0, 1.0, 2.0) - IMG_NORM_PIXEL(inputImage, isf_FragNormCoord.xy);
}
