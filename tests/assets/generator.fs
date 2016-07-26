/*{
	"CREDIT": "by no one",
	"DESCRIPTION": "",
	"CATEGORIES": [],
	"INPUTS": [

	]
}*/

void main() {
	vec4 c = vec4(0.0, 0.0, 0.0, 1.0);
	c.r = isf_FragNormCoord.x;
	c.g = isf_FragNormCoord.y;
	gl_FragColor = c;
}
