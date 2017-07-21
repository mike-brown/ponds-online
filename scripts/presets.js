'use strict'

const { Path: { Rectangle, Line } } = require('paper')

const colors = require('./colors')

const presets = {
  linearPlates: editor => {
    editor.pond = new Rectangle({
      topLeft: [100, 100],
      bottomRight: [400, 200],
      fillColor: colors.aqua
    })
    editor.baseLayer.addChild(editor.pond)

    editor.inlet = new Line({
      from: [100, 100],
      to: [100, 200],
      strokeColor: colors.blue,
      strokeCap: 'round',
      strokeWidth: 5
    })
    editor.baseLayer.addChild(editor.inlet)

    editor.outlet = new Line({
      from: [400, 100],
      to: [400, 200],
      strokeColor: colors.orange,
      strokeCap: 'round',
      strokeWidth: 5
    })
    editor.baseLayer.addChild(editor.outlet)
  },
  basic: editor => {
    editor.pond = new Rectangle({
      topLeft: [100, 100],
      bottomRight: [400, 200],
      fillColor: colors.aqua
    })
    editor.baseLayer.addChild(editor.pond)

    editor.inlet = new Line({
      from: [100, 100],
      to: [100, 200],
      strokeColor: colors.blue,
      strokeCap: 'round',
      strokeWidth: 5
    })
    editor.baseLayer.addChild(editor.inlet)

    editor.outlet = new Line({
      from: [400, 100],
      to: [400, 200],
      strokeColor: colors.orange,
      strokeCap: 'round',
      strokeWidth: 5
    })
    editor.baseLayer.addChild(editor.outlet)
  },
  island: editor => {
    editor.pond = new Rectangle({
      topLeft: [100, 100],
      bottomRight: [400, 200],
      fillColor: colors.aqua
    })
    editor.baseLayer.addChild(editor.pond)

    editor.inlet = new Line({
      from: [100, 100],
      to: [100, 200],
      strokeColor: colors.blue,
      strokeCap: 'round',
      strokeWidth: 5
    })
    editor.baseLayer.addChild(editor.inlet)

    editor.outlet = new Line({
      from: [400, 100],
      to: [400, 200],
      strokeColor: colors.orange,
      strokeCap: 'round',
      strokeWidth: 5
    })
    editor.baseLayer.addChild(editor.outlet)
  }
}

module.exports = {
  presets
}
