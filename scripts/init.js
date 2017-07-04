/* global GL:false */
'use strict'

const {
  AddTool,
  RemoveTool,
  VegTool,
  InletTool,
  OutletTool
} = require('./tools')
const { Editor } = require('./editor')

document.addEventListener('DOMContentLoaded', () => {
  // canvas
  const $canvases = document.querySelector('.canvases')
  const $designCanvas = $canvases.querySelector('canvas.design')
  const $run = document.querySelector('button.run')

  let simulating = false

  const startSim = () => {
    $run.classList.remove('primary')
    $run.classList.add('secondary')
    $run.textContent = 'Stop Simulation'
    document.querySelector('.title').textContent = 'Simulation'

    $designCanvas.style.display = 'none'
  }

  const stopSim = () => {
    $run.classList.remove('secondary')
    $run.classList.add('primary')
    $run.textContent = 'Run Simulation'
    document.querySelector('.title').textContent = 'Design'
  }

  $run.addEventListener('click', () => {
    if (!simulating) {
      startSim()
    } else {
      stopSim()
    }

    simulating = !simulating
  })

  const $canvas = document.querySelector('canvas.design')

  // initialise editor
  const editor = new Editor($canvas)

  const $addTool = document.querySelector('.js-add-tool')
  const $removeTool = document.querySelector('.js-remove-tool')
  const $vegTool = document.querySelector('.js-veg-tool')
  const $inletTool = document.querySelector('.js-inlet-tool')
  const $outletTool = document.querySelector('.js-outlet-tool')
  const $resetTool = document.querySelector('.js-reset-tool')

  editor.registerTool('add', new AddTool(editor, $addTool))
  editor.registerTool('remove', new RemoveTool(editor, $removeTool))
  editor.registerTool('veg', new VegTool(editor, $vegTool))
  editor.registerTool('inlet', new InletTool(editor, $inletTool))
  editor.registerTool('outlet', new OutletTool(editor, $outletTool))

  $addTool.addEventListener('click', () => {
    editor.drawing = true
    editor.activateTool('add')

    $addTool.blur()
  })

  $removeTool.addEventListener('click', () => {
    if (editor.drawing) {
      Editor.removeLastSegment(editor.pond)
      editor.fillPond()
    }

    editor.drawing = true
    editor.activateTool('remove')

    $removeTool.blur()
  })

  $vegTool.addEventListener('click', () => {
    if (editor.drawing) {
      Editor.removeLastSegment(editor.pond)
      editor.fillPond()
    }

    editor.drawing = true
    editor.activateTool('veg')

    $vegTool.blur()
  })

  $inletTool.addEventListener('click', () => {
    editor.activateTool('inlet')

    $inletTool.blur()
  })

  $outletTool.addEventListener('click', () => {
    editor.activateTool('outlet')

    $outletTool.blur()
  })

  $resetTool.addEventListener('click', () => {
    editor.reset()
    $resetTool.blur()
  })

  window.addEventListener('keydown', ev => {
    if (ev.keyCode === 27) {
      editor.deactivateActiveTool()
    }
  })
})
