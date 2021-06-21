/*{
  "CATEGORIES": [
      "Testing"
  ],
  "CREDIT": "NERDDISCO",
  "INPUTS": [
      {
          "NAME": "inputImage",
          "TYPE": "image"
      }
  ],
  "ISFVSN": "2"
}
*/

void main() {
    float x = isf_FragNormCoord.x;
    float y = isf_FragNormCoord.y;
    vec4 color = IMG_NORM_PIXEL(inputImage, isf_FragNormCoord);
    color = IMG_NORM_PIXEL(inputImage, vec2(isf_FragNormCoord));
    color = IMG_NORM_PIXEL(inputImage, vec2(isf_FragNormCoord.x, isf_FragNormCoord.y));
    color = IMG_NORM_PIXEL(inputImage, vec2(x, y));
    color = IMG_NORM_PIXEL(inputImage, vec3(x, y, x).xy);
    color = IMG_NORM_PIXEL(inputImage, vec4(x, y, x, y).xy);
    color = IMG_NORM_PIXEL(inputImage,vec4(x,y,x,y).xy);
  
    gl_FragColor = color;
  }