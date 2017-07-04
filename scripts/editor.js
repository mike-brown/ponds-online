'use strict'

const { paper, Path } = require('paper')

class Editor {
  constructor ($canvas) {
    paper.setup($canvas)
    paper.settings.hitTolerance = 5

    this.project = paper.project
    this.layer = this.project.activeLayer

    this.tools = {}

    this.reset()
  }

  registerTool (name, tool) {
    this.tools[name] = tool
  }

  deregisterTool (name) {
    delete this.tools[name]
  }

  activateTool (name) {
    console.log(`activating ${name} tool`)
    this.tools[name].activate()
  }

  add (item) {}

  reset () {
    if (this.pond) this.pond.remove()
    if (this.mask) this.mask.remove()
    if (this.vegmask) this.vegmask.remove()
    if (this.inlet) this.inlet.remove()
    if (this.outlet) this.outlet.remove()
    if (this.veg) this.veg.forEach(veg => veg.remove())

    this._activeTool = undefined
    this.drawing = false
    this.pond = Editor.createPond()
    this.mask = Editor.createMask()
    this.vegmask = Editor.createVegMask()
    this.veg = []
    this.inlet = undefined
    this.outlet = undefined
  }

  fillPond () {
    this.pond.fillColor = this.pond.intersects(this.pond) ? 'red' : 'lightblue'
  }

  static removeLastSegment (path) {
    path.removeSegment(path.segments.length - 1)
  }

  static createPond () {
    const pond = new Path()
    pond.strokeColor = Editor.colors.white
    pond.fillColor = Editor.colors.aqua
    pond.closed = true

    return pond
  }

  static createMask () {
    const mask = new Path()
    mask.strokeColor = Editor.colors.white
    mask.fillColor = Editor.colors.black
    mask.closed = true

    return mask
  }

  static createVegMask () {
    const mask = new Path()
    mask.strokeColor = Editor.colors.white
    mask.fillColor = Editor.colors.green
    mask.closed = true

    return mask
  }

  static get colors () {
    return {
      white: '#ffffff',
      black: '#000000',
      red: '#ff4136',
      orange: '#ff851b',
      blue: '#0074d9',
      green: '#2ecc40',
      aqua: '#7fdbff'
    }
  }
}

module.exports = {
  Editor
}
