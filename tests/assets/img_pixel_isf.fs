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
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  vec4 color = IMG_PIXEL(inputImage, gl_FragCoord.xy);
  color = IMG_PIXEL(inputImage, vec2(gl_FragCoord.xy));
  color = IMG_PIXEL(inputImage, vec2(gl_FragCoord.x, gl_FragCoord.y));
  color = IMG_PIXEL(inputImage, vec2(x, y));
  color = IMG_PIXEL(inputImage, vec3(x, y, x).xy);
  color = IMG_PIXEL(inputImage, vec4(x, y, x, y).xy);

  gl_FragColor = color;
}