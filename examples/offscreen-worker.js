// Import the ISF library
importScripts('/dist/build-worker.js');

const ISFRenderer = self.interactiveShaderFormat.Renderer;

const renderers = [];
let raf = null;

// OffscreenCanvas is attached to the WorkerGlobalScope
const mainCanvas = new OffscreenCanvas(256, 256);
const mainContext = mainCanvas.getContext('webgl');

const textCanvas = new OffscreenCanvas(256, 256);
const textContext = textCanvas.getContext('2d');


const text = 'ISF OffscreenCanvas 🙌';

let resizeQueued = false;
const size = {
  width: 0,
  height: 0,
};

const frame = (delta) => {
  raf = requestAnimationFrame(frame);
  if (!textCanvas) return;

  if (resizeQueued) {
    mainCanvas.width = size.width;
    mainCanvas.height = size.height;

    textCanvas.width = size.width;
    textCanvas.height = size.height;
  }

  // Draw some text to test with
  const { width, height } = textCanvas;

  textContext.font = '30pt sans-serif';
  textContext.textAlign = 'center';
  textContext.fillStyle = 'black';
  textContext.fillRect(0, 0, width, height);
  textContext.fillStyle = `hsl(${delta / 40}, 80%, 60%)`;
  textContext.fillText(
    text,
    Math.round((width / 2) + ((10 * Math.sin(delta / 400)) * (3 * -Math.sin(delta / 380)))),
    Math.round((height / 2) + ((18 * -Math.cos(delta / 400)) * (4 * Math.cos(delta / 480)))),
  );

  renderers.forEach((rendererObj) => {
    const { renderer, canvas, context } = rendererObj;

    if (resizeQueued) {
      canvas.width = size.width;
      canvas.height = size.height;
    }

    renderer.setValue('inputImage', textCanvas);
    renderer.draw(mainCanvas);

    context.drawImage(mainCanvas, 0, 0);
  });

  if (resizeQueued) {
    resizeQueued = false;
  }
}

raf = requestAnimationFrame(frame);

onmessage = (e) => {
  const { data } = e;
  const { message, payload } = data;

  switch (message) {
    case 'createRendering':
      const { canvas, vertexShader, fragmentShader } = payload;
      const context = canvas.getContext('2d');

      const renderer = new ISFRenderer(mainContext);
      renderer.loadSource(fragmentShader, vertexShader);

      renderers.push({
        renderer,
        canvas,
        context
      });
      break;

    case 'setSize':
      const { width, height } = payload;

      size.width = width;
      size.height = height;
      resizeQueued = true;
      break;

    default:
      break;
  }
};