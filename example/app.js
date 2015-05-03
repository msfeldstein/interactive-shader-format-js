var video = null;
var time = 0;
function loadFile(src, callback) {
  fetch(src).then(function(response) {
    response.text().then(function(body) {
      callback(body);
    })
  })
}

function createRendering(fsFilename, vsFilename, label) {
  var fsSrc;
  var fsLoaded = function(response) {
    fsSrc = response;
    if (vsFilename) {
      loadFile(vsFilename, vsLoaded)
    } else {
      vsLoaded()
    }
  }
  var vsLoaded = function(vsSrc) {
    var container = document.createElement('div');
    var canvas = document.createElement('canvas');
    var title = document.createElement('div');
    title.style.position = 'absolute';
    title.style.top = '0'
    title.style.color = 'white';
    title.style.left = '0'
    container.style.position = 'relative';
    container.appendChild(canvas);
    container.appendChild(title);
    title.textContent = fsFilename;
    if (label) {
      title.textContent += "(" + label + ")"
    }
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight / 2;
    document.body.appendChild(container);
    var gl = canvas.getContext("webgl");
    var renderer = new ISFRenderer(gl);
    renderer.loadSource(fsSrc, vsSrc);
    var animate = function () {
      requestAnimationFrame(animate);
      renderer.setValue("inputImage", video);
      renderer.setValue("TIME", time);
      renderer.draw(canvas);
      time += 0.01;
    }
    animate();
  }
  loadFile(fsFilename, fsLoaded);

}
window.addEventListener("load", function() {

  video = document.createElement('video');
  var videoStarted = function(localMediaStream) {
    video.src = URL.createObjectURL(localMediaStream)
    video.play()
    video.loop = true
  }
  var videoError = function(e) {
  }
  navigator.webkitGetUserMedia({video:true}, videoStarted, videoError)
  createRendering('badtv.fs', undefined, "Simple");
  createRendering('feedback.fs', undefined, "Has target on last pass");
  createRendering('rgbtimeglitch.fs', undefined, "Has lots of buffers and passes");
  createRendering('rgbglitchmod.fs', undefined, "Has target on last pass");
  createRendering('edges.fs', 'edges.vs', "Has custom vertex shader");
  // createRendering('tapestryfract.fs');
})
