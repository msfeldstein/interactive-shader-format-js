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

## Testing

Testing requires node-webgl which has a lot of dependencies, here's the steps that I think you'll need but you'll probably run into errors.  I feel like there's a better way of installing all these dependencies so if i'm missing something like `npm install --with-dependencies` please let me know.

```
brew tap homebrew/versions
brew install glfw3
brew install glew
brew install AntTweakBar
brew install FreeImage
npm install
```
