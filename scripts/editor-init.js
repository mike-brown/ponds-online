'use strict'

const { AddTool } = require('./add-tool')
const { RemoveTool } = require('./remove-tool')
const { Editor } = require('./editor')

document.addEventListener('DOMContentLoaded', () => {
  const $canvas = document.querySelector('canvas.design')

  const editor = new Editor($canvas)
  const addTool = new AddTool(editor)
  const removeTool = new RemoveTool(editor)

  editor.registerTool('add', addTool)
  editor.registerTool('remove', removeTool)

  document.querySelector('.js-add-tool').addEventListener('click', () => {
    editor.drawing = true
    editor.activateTool('add')
  })

  document.querySelector('.js-remove-tool').addEventListener('click', () => {
    if (editor.drawing) {
      editor.removeLastSegment(editor.pond)
      editor.fillPond()
    }

    editor.drawing = true
    editor.activateTool('remove')
  })
})
