'use strict'

const Mousetrap = require('mousetrap')

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
  const $run = document.querySelector('.js-run')

  let simulating = false

  const startSim = () => {
    if (editor.isReady()) {
      $run.classList.remove('primary')
      $run.classList.add('secondary')
      $run.textContent = 'Stop Simulation'
      document.querySelector('.title').textContent = 'Simulation'

      $designCanvas.style.display = 'none'
    }
  }

  const stopSim = () => {
    $run.classList.remove('secondary')
    $run.classList.add('primary')
    $run.textContent = 'Run Simulation'
    document.querySelector('.title').textContent = 'Design'
  }

  $run.addEventListener('click', () => {
    if (!simulating) {
      // startSim()

      editor.scaleLayer.visible = false
      editor.gridLayer.visible = false
      editor.subGridLayer.visible = false

      editor.baseLayer.fitBounds(editor.view.bounds)
      editor.baseLayer.scale(0.98, editor.view.center)
      editor.pond.fillColor = '#0affff'

      editor.inlet.strokeWidth = 5
      editor.outlet.strokeWidth = 5
      editor.inlet.strokeColor = '#0100ff'
      editor.outlet.strokeColor = '#02ff00'

      const raster = editor.baseLayer.rasterize(72)

      const { data, width, height } = raster.getImageData(editor.view.bounds)

      const reds = Float32Array.from(
        data.filter((val, index) => {
          return index % 4 === 0
        })
      )

      const input = Array.from(Array(height)).map((val, i) => {
        return Array.from(reds.slice(i * width, i * width + width))
      })

      console.log(input)
    } else {
      stopSim()
    }

    simulating = !simulating
  })

  // initialise editor
  const editor = new Editor($designCanvas)

  const $addTool = document.querySelector('.js-add-tool')
  const $removeTool = document.querySelector('.js-remove-tool')
  const $vegTool = document.querySelector('.js-veg-tool')
  const $inletTool = document.querySelector('.js-inlet-tool')
  const $outletTool = document.querySelector('.js-outlet-tool')

  const toolButtons = [
    [new AddTool(editor, $addTool), $addTool, 'add'],
    [new RemoveTool(editor, $removeTool), $removeTool, 'remove'],
    [new VegTool(editor, $vegTool), $vegTool, 'veg'],
    [new InletTool(editor, $inletTool), $inletTool, 'inlet'],
    [new OutletTool(editor, $outletTool), $outletTool, 'outlet']
  ]

  const $resetTool = document.querySelector('.js-reset-tool')
  const $gridSnapTool = document.querySelector('.js-grid-snap')
  const $subdivisionsTool = document.querySelector('.js-grid-subdivisions')

  toolButtons.forEach(([tool, button, toolName]) => {
    editor.registerTool(toolName, tool)

    button.addEventListener('click', () => {
      editor.activateTool(toolName)
    })
  })

  $resetTool.addEventListener('click', () => {
    editor.reset()
  })

  $gridSnapTool.addEventListener('click', () => {
    $gridSnapTool.checked = editor.gridSnap = !editor.gridSnap
  })

  $subdivisionsTool.addEventListener('change', () => {
    editor.GRID_SUBDIVISIONS = $subdivisionsTool.value

    editor.subGridLayer.remove()
    editor.subGridLayer = editor.project.addLayer(editor.createSubGridLayer())
    editor.subGridLayer.scale(editor.zoomLevel, editor.view.center)

    editor.subGridLayer.position = editor.gridLayer.position.clone()

    $subdivisionsTool.parentNode.querySelector(
      '.js-grid-subdivisions-val'
    ).textContent =
      $subdivisionsTool.value
  })

  $designCanvas.addEventListener('mousewheel', ev => {
    ev.preventDefault()
    editor.zoom(1 + ev.wheelDeltaY / 1000)
  })

  Mousetrap.bind('esc', ev => {
    editor.activateTool('hand')
    if (editor.isReady()) {
      $run.disabled = false
    }
  })

  Mousetrap.bind('a', ev => {
    editor.activateTool('add')
  })

  Mousetrap.bind('s', ev => {
    editor.activateTool('remove')
  })

  Mousetrap.bind('v', ev => {
    editor.activateTool('veg')
  })

  Mousetrap.bind('i', ev => {
    editor.activateTool('inlet')
  })

  Mousetrap.bind('o', ev => {
    editor.activateTool('outlet')
  })

  Mousetrap.bind('r', ev => {
    editor.reset()
    editor.activateTool('hand')
  })

  Mousetrap.bind('-', ev => {
    ev.preventDefault()
    editor.zoom('out')
  })

  Mousetrap.bind('=', ev => {
    ev.preventDefault()
    editor.zoom('in')
  })

  Mousetrap.bind('shift', ev => {
    editor.angleSnap = true
  })

  Mousetrap.bind(
    'shift',
    ev => {
      editor.angleSnap = false
    },
    'keyup'
  )

  Mousetrap.bind('g', ev => {
    $gridSnapTool.checked = editor.gridSnap = !editor.gridSnap
  })

  if (editor.isReady()) {
    $run.disabled = false
  }
})
