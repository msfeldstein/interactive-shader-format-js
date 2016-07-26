/*{
	"CREDIT": "by no one",
	"DESCRIPTION": "Transition",
	"CATEGORIES": [],
	"INPUTS": [
		{
			"TYPE": "image",
			"NAME": "startImage"
		},
		{
			"TYPE": "image",
			"NAME": "endImage"
		},
		{
			"TYPE": "float",
			"NAME": "progress",
			"MIN": 0,
			"MAX": 1
		}
	]
}*/

void main() {
	vec4 start = IMG_NORM_PIXEL(startImage, isf_FragNormCoord.xy);
	vec4 end = IMG_NORM_PIXEL(endImage, isf_FragNormCoord.xy);
	gl_FragColor = mix(start, end, progress);
}
