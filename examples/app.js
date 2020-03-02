const ISFRenderer = require('../dist/build.js').Renderer;

let video = null;

async function loadFile(src, callback) {
  const response = await fetch('examples/' + src);
  const body = await response.text();

  callback(body);
}

function createRendering(fsFilename, vsFilename, label) {
  let fsSrc;
  const fsLoaded = (response) => {
    fsSrc = response;

    if (vsFilename) {
      loadFile(vsFilename, vsLoaded);
    } else {
      vsLoaded();
    }
  }

  const vsLoaded = (vsSrc) => {
    const container = document.createElement('div');
    const canvas = document.createElement('canvas');
    const title = document.createElement('div');

    title.style.position = 'absolute';
    title.style.top = '0'
    title.style.color = 'white';
    title.style.left = '0'

    container.style.position = 'relative';
    container.appendChild(canvas);
    container.appendChild(title);

    title.textContent = fsFilename;

    if (label) {
      title.textContent += '(' + label + ')'
    }

    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight / 2;
    document.body.appendChild(container);

    // Using webgl2 for non-power-of-two textures
    const gl = canvas.getContext('webgl2');
    const renderer = new ISFRenderer(gl);
    renderer.loadSource(fsSrc, vsSrc);

    const animate = () => {
      requestAnimationFrame(animate);

      // tapestryfract doesn't have inputImage so we'll need to check
      if ('inputImage' in renderer.uniforms) {
        renderer.setValue('inputImage', video);
      }

      renderer.draw(canvas);
    };

    requestAnimationFrame(animate);
  }

  loadFile(fsFilename, fsLoaded);
}

const button = document.createElement('button');
button.textContent = 'Start webcam';
document.body.appendChild(button);

createRendering('tapestryfract.fs');

button.addEventListener('click', function() {
  video = document.createElement('video')
  video.autoplay = true

  navigator.mediaDevices.getUserMedia({
    video: true
  }).then(function(stream){
    video.srcObject = stream        
  })

  createRendering('badtv.fs', undefined, 'Simple');
  createRendering('feedback.fs', undefined, 'Has target on last pass');
  createRendering('rgbtimeglitch.fs', undefined, 'Has lots of buffers and passes');
  createRendering('rgbglitchmod.fs', undefined, 'Has target on last pass');
  createRendering('edges.fs', 'edges.vs', 'Has custom vertex shader');
})
