/*{
	"DESCRIPTION": "Error on line 6/7, missing comma",
	"CREDIT": "by VIDVOX",
	"CATEGORIES": [
		"Glitch"
	]
	"INPUTS": [
		{
			"TYPE": "float",
			"NAME": "xPos",
			"MIN": 0,
			"MAX": 1
		}
	],
}*/



void main()
{
	if (PASSINDEX == 0) {
		float val = 1.0 - abs(xPos - isf_FragNormCoord.x) * 13.0;
		val = max(val, 0.0);
		gl_FragColor = vec4(val, val, val, val) + IMG_NORM_PIXEL(buffer1, isf_FragNormCoord.xy);
	} else {
		gl_FragColor = IMG_NORM_PIXEL(buffer1, isf_FragNormCoord.xy);
	}
}
