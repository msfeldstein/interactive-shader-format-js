const worker = new Worker('./examples/offscreen-worker.js');

async function loadFile(src) {
  let body;

  if (src) {
    const response = await fetch(`./examples/${src}`);
    body = await response.text();
  } else {
    new Error('No source');
  }

  return body;
}

const flexContainer = document.createElement('div');
flexContainer.classList.add('flex');
document.body.appendChild(flexContainer);

async function createRendering(fsFilename, vsFilename, label) {
  const fragmentShader = await loadFile(fsFilename);
  let vertexShader = null;
  try {
    vertexShader = await loadFile(vsFilename);
  } catch (e) {
    // do nothing
  }

  const container = document.createElement('div');
  const canvas = document.createElement('canvas');
  const title = document.createElement('div');
  title.classList.add('title');
  title.textContent = fsFilename;

  container.appendChild(canvas);
  container.appendChild(title);

  if (label) {
    title.textContent += ` (${label})`;
  }

  flexContainer.appendChild(container);

  canvas.width = window.innerWidth / 2;
  canvas.height = window.innerHeight / 2;

  const offscreen = canvas.transferControlToOffscreen();

  worker.postMessage({
    message: 'createRendering',
    payload: {
      canvas: offscreen,
      fragmentShader,
      vertexShader,
    },
  }, [ offscreen ]);
}

function resize() {
  worker.postMessage({
    message: 'setSize',
    payload: {
      width: (window.innerWidth / 2),
      height: (window.innerHeight / 2),
      dpr: window.devicePixelRatio,
    },
  });
}
resize();

let resizeRaf;
let lastArea = 0;

function checkResize() {
  resizeRaf = requestAnimationFrame(checkResize);
  const thisArea = window.innerWidth * window.innerHeight;
  console.log(lastArea, thisArea);
  if (thisArea === lastArea) {
    resize();
    cancelAnimationFrame(resizeRaf);
    return;
  }

  lastArea = thisArea;
}

window.addEventListener('resize', () => {
  resizeRaf = requestAnimationFrame(checkResize);
});

createRendering('badtv.fs', undefined, 'Simple');
createRendering('feedback.fs', undefined, 'Has target on last pass');
createRendering('rgbtimeglitch.fs', undefined, 'Has lots of buffers and passes');
createRendering('rgbglitchmod.fs', undefined, 'Has target on last pass');
createRendering('edges.fs', 'edges.vs', 'Has custom vertex shader');
// createRendering('tapestryfract.fs');
