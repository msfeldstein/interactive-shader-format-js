# ISF-JS-Renderer

Renders ISF Effects and Compositions into a canvas

[http://www.interactiveshaderformat.com/]([http://www.interactiveshaderformat.com/])

## Example

```
var gl = canvas.getContext("webgl");

# Instantiate the renderer with your webgl context
var renderer = new ISFRenderer(gl);

# Load up the source
renderer.loadSource(fragmentISF, optionalVertexISF);

# Set up any values passing either numbers, arrays of numbers, or image/video elements
renderer.setValue("someInput", someValue);

# Draw it into the canvas
renderer.draw(canvas);
```

## Raw ISF Parsing

Use the ISFParser class to parse ISF Fragment and Vertex shaders to GLSL shaders and an input data-mapping.

```
var parser = new ISFParser();
parser.parse(fragmentISF, optionalVertexISF);
console.log(parser.fragmentShader, parser.vertexShader, parser.inputs);
```

## Building

Build with browserify

```
npm install -g browserify
browserify main.js -o build/main.js

or

npm install -g watchify
watchify main.js -o build/main.js
```
