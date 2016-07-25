precision highp float;
precision highp int;
void vv_vertShaderInit();

attribute vec2 position; // -1..1

uniform int     PASSINDEX;
uniform vec2    RENDERSIZE;
varying vec2    vv_FragNormCoord; // 0..1
vec2    vv_fragCoord; // Pixel Space

[[uniforms]]

[[main]]
void vv_vertShaderInit(void)  {
gl_Position = vec4( position, 0.0, 1.0 );
  vv_FragNormCoord = vec2((gl_Position.x+1.0)/2.0, (gl_Position.y+1.0)/2.0);
  vv_fragCoord = floor(vv_FragNormCoord * RENDERSIZE);
  [[functions]]
}
