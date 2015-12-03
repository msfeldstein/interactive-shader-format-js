var ISFRenderer = require('../lib/ISFRenderer').ISFRenderer
console.log(ISFRenderer)
var fs = require('fs')
var canvas = document.createElement('canvas')
document.body.appendChild(canvas)


var src = fs.readFileSync('./example/shaders/buffer-queue.isf').toString()
var renderer = new ISFRenderer(canvas.getContext('webgl'))
window.renderer = renderer
renderer.loadSource(src)

var video = document.createElement('video')
video.src = './example/circle.mp4'
video.loop = true
video.play()

var draw = function() {
  requestAnimationFrame(draw)
  if (video.readyState == 4) {
    renderer.setValue("inputImage", video)
    renderer.draw(canvas)
  }
}
draw()