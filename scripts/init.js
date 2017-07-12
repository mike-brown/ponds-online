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
  const $gridSnapTool = document.querySelector('.js-grid-snap')

  editor.registerTool('add', new AddTool(editor, $addTool))
  editor.registerTool('remove', new RemoveTool(editor, $removeTool))
  editor.registerTool('veg', new VegTool(editor, $vegTool))
  editor.registerTool('inlet', new InletTool(editor, $inletTool))
  editor.registerTool('outlet', new OutletTool(editor, $outletTool))

  $addTool.addEventListener('click', () => {
    editor.activateTool('add')
  })

  $removeTool.addEventListener('click', () => {
    editor.activateTool('remove')
  })

  $vegTool.addEventListener('click', () => {
    editor.activateTool('veg')
  })

  $inletTool.addEventListener('click', () => {
    editor.activateTool('inlet')
  })

  $outletTool.addEventListener('click', () => {
    editor.activateTool('outlet')
  })

  $resetTool.addEventListener('click', () => {
    editor.reset()
  })

  $gridSnapTool.addEventListener('click', () => {
    editor.gridSnap = !!$gridSnapTool.checked
  })

  $canvas.addEventListener('mousewheel', ev => {
    ev.preventDefault()
    editor.zoom(1 + -ev.wheelDeltaY / 1000)
  })

  $run.addEventListener('click', () => {
    window.location = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  })

  window.addEventListener('keydown', ev => {
    const keys = {
      Escape: ev => {
        editor.deactivateActiveTool()
        if (editor.isReady()) {
          $run.disabled = false
        }
      },

      KeyA: ev => {
        editor.activateTool('add')
      },

      KeyS: ev => {
        editor.activateTool('remove')
      },

      KeyV: ev => {
        editor.activateTool('veg')
      },

      KeyI: ev => {
        editor.activateTool('inlet')
      },

      KeyO: ev => {
        editor.activateTool('outlet')
      },

      KeyR: ev => {
        editor.reset()
        editor.deactivateActiveTool()
      }
    }

    if (ev.code in keys) keys[ev.code](ev)
  })
})
