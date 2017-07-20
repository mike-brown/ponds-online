'use strict'

const { Path } = require('paper')
const Mousetrap = require('mousetrap')

const {
  zeros,
  ax,
  ay,
  couple,
  jacobi,
  correct,
  converge
} = require('../prototype/fluid')

const {
  dye,
  concentrations,
  corrections,
  record
} = require('../prototype/flow')

const { CELL_SIZE, COLS, ROWS, params, values } = require('../prototype/config')

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
  const $simulationCanvas = $canvases.querySelector('canvas.simulation')
  const $run = document.querySelector('.js-run')

  let simulating = false

  const startSim = (input, w, h) => {
    if (editor.isReady()) {
      $run.classList.remove('primary')
      $run.classList.add('secondary')
      $run.textContent = 'Stop Simulation'
      document.querySelector('.title').textContent = 'Simulation'

      const xctx = $simulationCanvas.getContext('2d')
      xctx.canvas.width = (w + 1) * CELL_SIZE + 1
      xctx.canvas.height = h * CELL_SIZE + 1

      let count = 0

      let state = input.map(arr => [...arr])

      let prevP = zeros(h, w)
      let prevX = zeros(h, w + 1)
      let prevY = zeros(h + 1, w)

      let primeP = zeros(h, w)
      let aX = zeros(h, w + 1)
      let aY = zeros(h + 1, w)

      const draw = (sArr, pArr, xArr, yArr) => {
        xctx.clearRect(0, 0, xctx.canvas.width, xctx.canvas.height)

        let maxp = 0
        let maxv = 0

        for (let y = 0; y < pArr.length; y++) {
          for (let x = 0; x < pArr[y].length; x++) {
            maxp = Math.max(maxp, Math.abs(pArr[y][x]))
          }
        }

        for (let y = 0; y < xArr.length; y++) {
          for (let x = 0; x < xArr[y].length; x++) {
            maxv = Math.max(maxv, Math.abs(xArr[y][x]))
          }
        }

        for (let y = 0; y < yArr.length; y++) {
          for (let x = 0; x < yArr[y].length; x++) {
            maxv = Math.max(maxv, Math.abs(yArr[y][x]))
          }
        }

        for (let i = 0; i < xArr.length; i++) {
          for (let j = 0; j < xArr[i].length; j++) {
            const val = 240 - xArr[i][j] / maxv * 240

            xctx.fillStyle = `hsl(${val}, 100%, 50%)`
            xctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          }
        }
      }

      const initiate = () => {
        const valsX = ax(state, prevX, prevY, values.density, values.diffuse)

        const valsY = ay(state, prevX, prevY, values.density, values.diffuse)

        const [tempX, tempY] = couple(
          state,
          prevP,
          prevX,
          prevY,
          valsX,
          valsY,
          params.size,
          params.mu,
          params.nu,
          params.rho,
          params.input.x,
          params.input.y
        )

        primeP = jacobi(state, primeP, tempX, tempY, valsX, valsY, params.size)

        const [nextX, nextY, nextP] = correct(
          state,
          prevP,
          primeP,
          tempX,
          tempY,
          prevX,
          prevY,
          valsX,
          valsY,
          params.size,
          params.input.x,
          params.input.y
        )

        if (count === 0) {
          draw(state, nextP, nextX, nextY)
          count = 1
        }

        count--
        prevX = nextX.map(arr => [...arr])
        prevY = nextY.map(arr => [...arr])
        prevP = nextP.map(arr => [...arr])

        // draw(state, nextP, nextX, nextY)
        requestAnimationFrame(initiate)
      }

      requestAnimationFrame(initiate)
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
      editor.view.autoUpdate = false

      editor.scaleLayer.visible = false
      editor.gridLayer.visible = false
      editor.subGridLayer.visible = false

      editor.baseLayer.fitBounds(editor.view.bounds)
      editor.baseLayer.scale(0.95, editor.view.center)

      editor.pond.fillColor = '#0affff'
      editor.inlet.strokeWidth = 2
      editor.outlet.strokeWidth = 2
      editor.inlet.strokeCap = 'butt'
      editor.outlet.strokeCap = 'butt'
      editor.inlet.strokeColor = '#0100ff'
      editor.outlet.strokeColor = '#02ff00'

      editor.view.update()
      const raster = editor.baseLayer.rasterize(72)
      editor.view.update()

      const $previewCanvas = raster.getSubCanvas({
        x: editor.view.bounds.x - 10,
        y: editor.view.bounds.y - 10,
        width: editor.view.bounds.width + 20,
        height: editor.view.bounds.height + 20
      })

      const pctx = $previewCanvas.getContext('2d')
      const imageData = pctx.getImageData(
        0,
        0,
        $previewCanvas.width,
        $previewCanvas.height
      )

      const { data, width, height } = imageData

      const reds = Array.from(
        data.filter((val, index) => {
          return index % 4 === 0
        })
      )

      const input = Array.from(Array(height)).map((val, i) => {
        return Array.from(reds.slice(i * width, i * width + width))
      })

      // const rasterArea = new Path.Rectangle({
      //   x: editor.baseLayer.bounds.x - 10,
      //   y: editor.baseLayer.bounds.y - 10,
      //   width: editor.baseLayer.bounds.width + 20,
      //   height: editor.baseLayer.bounds.height + 20
      // })
      // rasterArea.strokeWidth = 1
      // rasterArea.strokeColor = 'red'
      //
      // editor.baseLayer.addChild(rasterArea)
      // editor.view.update()

      $designCanvas.classList.remove('active')
      $previewCanvas.classList.add('active')
      $simulationCanvas.classList.add('active')

      $designCanvas.parentNode.appendChild($previewCanvas)

      startSim(input, width, height)
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
