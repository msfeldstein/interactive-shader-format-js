# ISF-JS-Renderer

Renders ISF Effects and Compositions into a canvas

## Example

```
var gl = canvas.getContext("webgl");

# Instantiate the renderer with your webgl context
var renderer = new ISFRenderer(gl);

# Instantiate a parser
var parser = new ISFParser()

# Parse the ISF Source code
parser.parse(isfFragmentSource, optionalIsfVertexSource);

# Send the Parsed Codes into the renderer
renderer.sourceChanged(parser.fragmentShader, parser.vertexShader, parser);

# Set up any values passing either numbers, arrays of numbers, or image/video elements
renderer.setValue("someInput", someValue);

# Draw it into the canvas
renderer.draw(canvas);
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
