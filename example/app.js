var video = null;
var time = 0;
function loadFile(src, callback) {
  fetch(src).then(function(response) {
    response.text().then(function(body) {
      callback(body);
    })
  })
}

function createRendering(fsFilename, vsFilename) {
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
    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth / 2;
    canvas.height = window.innerHeight / 2;
    document.body.appendChild(canvas);
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
  createRendering('badtv.fs');
  createRendering('rgbtimeglitch.fs');
  createRendering('rgbglitchmod.fs');
  createRendering('edges.fs', 'edges.vs');
  // createRendering('tapestryfract.fs');
})
