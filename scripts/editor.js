'use strict'

const {
  paper,
  Layer,
  Point,
  Path,
  Color,
  PointText,
  Path: { Line }
} = require('paper')

const { HandTool } = require('./hand-tool')

class Editor {
  constructor ($canvas) {
    this.scope = paper.setup($canvas)
    this.scope.settings = Object.assign({}, this.scope.settings, {
      insertItems: false,
      hitTolerance: 5
    })

    console.log(this.scope)

    this.GRID_SCALE = 100
    this.GRID_SUBDIVISIONS = 2
    this.ANGLE_SNAP = Math.PI / 8
    this.MAX_ZOOM = 8
    this.MIN_ZOOM = 0.2

    this.viewport = new Point({ x: 0, y: 0 })
    this.zoomLevel = 1
    this.angleSnap = false
    this.gridSnap = false

    this.view = this.scope.view
    this.project = this.scope.project

    this.baseLayer = this.project.activeLayer
    this.scaleLayer = this.project.addLayer(this.createScaleLayer())
    this.gridLayer = this.project.addLayer(this.createGridLayer())
    this.subGridLayer = this.project.addLayer(this.createSubGridLayer())

    this.tools = {}
    this.activeTool = undefined
    this.registerTool('hand', new HandTool(this))

    this.reset()

    this.zoom(2)
    this.zoom(0.5)
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

    if (this.activeTool) this.tools[this.activeTool].deactivate()

    console.info(`activating ${name} tool`)

    this.tools[name].activate()
    this.activeTool = name
  }

  reset () {
    if (this.resetinit && !confirm('Reset?')) {
      return
    } else {
      this.resetinit = true
    }

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

    this.activateTool('hand')

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
    return Math.abs(this.pond.area) >= 1 && this.inlet && this.outlet
  }

  zoom (factor) {
    const IN_SCALE = 1.25
    const OUT_SCALE = 1 / IN_SCALE

    const level =
      factor === 'in' ? IN_SCALE : factor === 'out' ? OUT_SCALE : factor || 1

    if (
      this.zoomLevel * level < this.MIN_ZOOM ||
      this.zoomLevel * level > this.MAX_ZOOM
    ) {
      return
    }

    this.zoomLevel *= level
    this.viewport = this.viewport.multiply(level)

    this.subGridLayer.scale(level, this.view.center)
    this.gridLayer.scale(level, this.view.center)
    this.baseLayer.scale(level, this.view.center)
    this.scaleLayer.scale(level, this.view.bounds.bottomLeft)

    this.subGridLayer.visible = this.zoomLevel > 0.7
  }

  createScaleLayer () {
    return new Layer({
      children: [
        new PointText({
          point: [0, 30],
          content: '0',
          fillColor: Editor.colors.white,
          fontFamily: 'Arial',
          fontWeight: 100,
          justification: 'center',
          fontSize: 25
        }),
        new PointText({
          point: [this.GRID_SCALE, 30],
          content: '1m',
          fillColor: Editor.colors.white,
          fontFamily: 'Arial',
          fontWeight: 100,
          justification: 'center',
          fontSize: 25
        }),
        new PointText({
          point: [-20, -this.GRID_SCALE + 10],
          content: '1m',
          fillColor: Editor.colors.white,
          fontFamily: 'Arial',
          fontWeight: 100,
          justification: 'center',
          fontSize: 25,
          rotation: -90
        }),
        new Path({
          segments: [
            [-5, -this.GRID_SCALE],
            [5, -this.GRID_SCALE],
            [0, -this.GRID_SCALE],
            [0, 0],
            [0, 5],
            [0, 0],
            [-5, 0],
            [0, 0],
            [this.GRID_SCALE, 0],
            [this.GRID_SCALE, -5],
            [this.GRID_SCALE, 5]
          ],
          strokeColor: Editor.colors.white,
          strokeWidth: 2
        })
      ],
      position: [80, this.view.size.height - 80]
    })
  }

  createGridLayer () {
    const grid = new Layer()

    // vertical gridlines
    for (let i = 0; i < 100; i++) {
      grid.addChild(
        new Line({
          from: [this.view.center.x + i * this.GRID_SCALE, this.view.center.y],
          to: [
            this.view.center.x + i * this.GRID_SCALE,
            this.view.center.y + 10000
          ],
          strokeWidth: 1,
          strokeColor: new Color(255, 0.5)
        })
      )
    }

    // horizontal gridlines
    for (let i = 0; i < 100; i++) {
      grid.addChild(
        new Line({
          from: [this.view.center.x, this.view.center.y + i * this.GRID_SCALE],
          to: [
            this.view.center.x + 10000,
            this.view.center.y + i * this.GRID_SCALE
          ],
          strokeWidth: 1,
          strokeColor: new Color(255, 0.5)
        })
      )
    }

    grid.position.x = this.view.center.x
    grid.position.y = this.view.center.y

    return grid
  }

  createSubGridLayer () {
    const grid = new Layer()

    // vertical subdivisions
    for (let i = 0; i < 100 * this.GRID_SUBDIVISIONS; i++) {
      grid.addChild(
        new Line({
          from: [
            this.view.center.x + i * this.GRID_SCALE / this.GRID_SUBDIVISIONS,
            0
          ],
          to: [
            this.view.center.y + i * this.GRID_SCALE / this.GRID_SUBDIVISIONS,
            10000
          ],
          strokeWidth: 1,
          strokeColor: new Color(255, 0.25)
        })
      )
    }

    // horizontal subdivisions
    for (let i = 0; i < 100 * this.GRID_SUBDIVISIONS; i++) {
      grid.addChild(
        new Line({
          from: [
            0,
            this.view.center.x + i * this.GRID_SCALE / this.GRID_SUBDIVISIONS
          ],
          to: [
            10000,
            this.view.center.y + i * this.GRID_SCALE / this.GRID_SUBDIVISIONS
          ],
          strokeWidth: 1,
          strokeColor: new Color(255, 0.25)
        })
      )
    }

    grid.position.x = -this.GRID_SCALE * 50
    grid.position.y = -this.GRID_SCALE * 50

    return grid
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
