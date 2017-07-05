'use strict'

const { paper, Path, Path: { Line }, Layer, Tool: PaperTool } = require('paper')

class Editor {
  constructor ($canvas) {
    this.scope = paper.setup($canvas)
    this.scope.settings = Object.assign(this.scope.settings, {
      insertItems: false,
      hitTolerance: 5
    })

    console.log(this.scope)

    this.view = this.scope.view
    this.project = this.scope.project

    this.baseLayer = this.project.activeLayer
    this.cursorLayer = new Layer({
      children: [
        new Line({
          from: [-10, 0],
          to: [10, 0]
        }),
        new Line({
          from: [0, -10],
          to: [0, 10]
        })
      ],
      strokeColor: Editor.colors.white,
      position: this.view.center
    })

    this.project.addLayer(this.cursorLayer)

    this.view.onMouseMove = ev => {
      this.cursorLayer.position = ev.point
    }

    this.nullTool = new PaperTool()

    this.tools = {}
    this.activeTool = undefined

    this.reset()
  }

  registerTool (name, tool) {
    this.tools[name] = tool
  }

  deregisterTool (name) {
    delete this.tools[name]
  }

  activateTool (name) {
    if (this.activeTool === name) {
      console.warn(`${name} tool is already active`)
      return
    }

    this.deactivateActiveTool()

    console.info(`activating ${name} tool`)

    this.tools[name].activate()
    this.activeTool = name
  }

  deactivateActiveTool () {
    if (this.activeTool) {
      this.tools[this.activeTool].deactivate()
      this.activeTool = undefined

      this.nullTool.activate()
    }
  }

  reset () {
    if (this.pond) this.pond.remove()
    if (this.mask) this.mask.remove()
    if (this.vegmask) this.vegmask.remove()
    if (this.inlet) this.inlet.remove()
    if (this.outlet) this.outlet.remove()
    if (this.veg) this.veg.forEach(veg => veg.remove())

    this.pond = Editor.createPond()
    this.mask = Editor.createMask()
    this.vegmask = Editor.createVegMask()
    this.veg = []
    this.inlet = undefined
    this.outlet = undefined

    this.baseLayer.addChildren([this.pond, this.mask, this.vegmask])
  }

  mergeVegetation () {
    if (!this.veg.length) return

    const allVeg = this.veg.reduce((allVeg, veg) => {
      return allVeg.unite(veg, { insert: false })
    }, Editor.createVegMask())

    this.veg.forEach(veg => {
      veg.remove()
    })

    this.veg = []
    this.veg.push(allVeg)
    this.baseLayer.addChild(allVeg)
  }

  isReady () {
    return this.pond.segments.length >= 3 && this.inlet && this.outlet
  }

  static validPond (pond) {
    return !pond.intersects(pond)
  }

  static pondColor (pond) {
    return Editor.validPond(pond) ? Editor.colors.aqua : Editor.colors.red
  }

  static fillPond (pond) {
    pond.fillColor = Editor.pondColor(pond)
  }

  static sanitizePond (pond) {
    if (!Editor.validPond(pond)) {
      console.warn('reverting pond to last valid state')
    }

    while (!Editor.validPond(pond)) {
      pond.removeSegment(pond.segments.length - 1)
    }
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
