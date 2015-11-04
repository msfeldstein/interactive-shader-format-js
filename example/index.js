var ISFRenderer = require('../lib/ISFRenderer').ISFRenderer
console.log(ISFRenderer)
var fs = require('fs')
var canvas = document.createElement('canvas')
document.body.appendChild(canvas)


var src = fs.readFileSync('./two-image.isf').toString()
var renderer = new ISFRenderer(canvas.getContext('webgl'))
renderer.loadSource(src)
var sunset = new Image
sunset.src = "sunset.jpg"

var frog = new Image
frog.src = "frog.jpg"

var imageLoad = function() {
  if (frog.complete && sunset.complete) {
    renderer.setValue("frogImage", frog)
    renderer.setValue("sunsetImage", sunset)
    renderer.draw(canvas)
  }
}

frog.onload = imageLoad
sunset.onload = imageLoad


renderer.draw(canvas)