# ISF-JS-Renderer

Renders ISF Effects and Compositions into a canvas

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

## Building

Build with browserify

```
npm install -g browserify
browserify main.js -o build/main.js

or

npm install -g watchify
watchify main.js -o build/main.js
```
