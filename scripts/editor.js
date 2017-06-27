/* global paper:false Path:false Tool:false */
'use strict'

paper.install(window)

let mode = 'line'
const boundaries = []

document.addEventListener('DOMContentLoaded', () => {
  const $canvas = document.querySelector('canvas.design')
  paper.setup($canvas)

  let drawing = true

  var tool = new Tool()
  const path = new Path()
  path.strokeColor = 'white'
  path.fillColor = 'lightblue'
  path.closed = true

  // Define a mousedown and mousedrag handler
  tool.onMouseDown = ev => {
    drawing = true

    path.strokeColor = 'white'
    path.add(ev.point)
  }

  tool.onMouseMove = ev => {
    if (drawing) {
      path.removeSegment(path.segments.length - 1)
      path.add(ev.point)
    }
  }

  tool.onKeyDown = ev => {
    if (ev.key === 'enter' && drawing) {
      path.removeSegment(path.segments.length - 1)
      drawing = false
    }
  }
})
