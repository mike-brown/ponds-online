/* global paper:false Path:false Tool:false */
'use strict'

paper.install(window)

document.addEventListener('DOMContentLoaded', () => {
  const $canvas = document.querySelector('canvas.design')
  paper.setup($canvas)

  let pond = new Path()
  pond.strokeColor = 'lightblue'
  pond.fillColor = 'lightblue'
  pond.closed = true
  window.pond = pond

  let mask = new Path()
  mask.strokeColor = 'white'
  mask.fillColor = 'black'
  mask.closed = true
  window.mask = mask

  const addTool = new Tool()
  const removeTool = new Tool()
  window.addTool = addTool
  window.removeTool = removeTool

  let drawing = false
  const getDrawing = () => drawing
  const setDrawing = state => {
    console.log('setting to', state)
    drawing = state
  }
  window.setDrawing = setDrawing
  window.getDrawing = getDrawing

  // add tool
  addTool.onMouseDown = ev => {
    if (getDrawing() && (!pond.intersects(pond) || pond.segments.length < 3)) {
      pond.add(ev.point)
    }
  }

  addTool.onMouseMove = ev => {
    if (getDrawing()) {
      pond.removeSegment(pond.segments.length - 1)
      pond.add(ev.point)

      pond.fillColor = pond.intersects(pond) ? 'red' : 'lightblue'
    }
  }

  addTool.onKeyDown = ev => {
    if (ev.key === 'shift' && getDrawing()) {
      setDrawing(false)

      pond.removeSegment(pond.segments.length - 1)
      pond.fillColor = pond.intersects(pond) ? 'red' : 'lightblue'
    }
  }

  // remove tool
  removeTool.onMouseDown = ev => {
    if (getDrawing()) {
      mask.add(ev.point)
    }
  }

  removeTool.onMouseMove = ev => {
    if (getDrawing()) {
      mask.removeSegment(mask.segments.length - 1)
      mask.add(ev.point)
    }
  }

  removeTool.onKeyDown = ev => {
    if (ev.key === 'shift' && getDrawing()) {
      setDrawing(false)

      mask.removeSegment(mask.segments.length - 1)
      const newPond = pond.subtract(mask)
      pond.remove()
      mask.remove()
      pond = newPond
      window.pond = pond

      mask = new Path()
      mask.strokeColor = 'white'
      mask.fillColor = 'black'
      mask.closed = true
      window.mask = mask
    }
  }
})
