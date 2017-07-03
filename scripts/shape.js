'use strict'

window.addEventListener('DOMContentLoaded', function () {
  const CELL_SIZE = 10
  const COLS = 99
  const ROWS = 59

  // TODO: velocity profile at end of simulation

  const running = document.querySelector('.js-running')
  const ctxp = document.querySelector('.canvasp').getContext('2d')
  const ctxx = document.querySelector('.canvasx').getContext('2d')
  const ctxy = document.querySelector('.canvasy').getContext('2d')
  const ctxpscale = document.querySelector('.canvaspscale').getContext('2d')
  const ctxxscale = document.querySelector('.canvasxscale').getContext('2d')
  const ctxyscale = document.querySelector('.canvasyscale').getContext('2d')

  ctxp.canvas.width = COLS * CELL_SIZE + 1
  ctxp.canvas.height = ROWS * CELL_SIZE + 1
  ctxx.canvas.width = (COLS + 1) * CELL_SIZE + 1
  ctxx.canvas.height = ROWS * CELL_SIZE + 1
  ctxy.canvas.width = (COLS + 1) * CELL_SIZE + 1
  ctxy.canvas.height = ROWS * CELL_SIZE + 1

  let state = zeros(ROWS, COLS)

  for (let j = 0; j < state.length; j++) {
    for (let i = 0; i < state[j].length; i++) {
      state[j][i] = 1 // sets all inner cells to water cells
    }
  }

  let prevP = zeros(ROWS, COLS) //     ( 9R, 27C)
  let prevX = zeros(ROWS, COLS + 1) // ( 9R, 28C)
  let prevY = zeros(ROWS + 1, COLS) // (10R, 27C)

  let oldP = zeros(ROWS, COLS)
  let newP

  let nextX = zeros(ROWS, COLS + 1)

  const params = {
    gamma: 0.2, // interface diffusion
    size: 0.01, // 10mm face area
    rho: 998.2, // 998.2kg/m^3 density
    mu: 0.00089, //  viscosity
    G: (0.00005 * ((ROWS - 1) / 100)) * 12 * 0.00089 / Math.pow((ROWS - 1) / 100, 3)
  }

  const constants = {
    density: params.rho / 2,
    diffuse: params.gamma / params.size
  }

  function zeros (ROWS, COLS) {
    let grid = []
    for (let j = 0; j < ROWS; j++) {
      let line = []
      for (let i = 0; i < COLS; i++) {
        line.push(0)
      }
      grid.push(line)
    }
    return grid
  }

  function edge (arr, j, i) {
    return arr[Math.max(Math.min(j, arr.length - 1), 0)][Math.max(Math.min(i, arr[0].length - 1), 0)]
  }

  function cell (arr, j, i) {
    const bx = (i >= 0) && (i < arr[0].length)
    const by = (j >= 0) && (j < arr.length)
    const bz = bx && by

    return arr[Math.max(Math.min(j, arr.length - 1), 0)][Math.max(Math.min(i, arr[0].length - 1), 0)] * bz
  }

  function draw (pArr, xArr, yArr) {
    ctxp.clearRect(0, 0, ctxp.canvas.width, ctxp.canvas.height)
    ctxx.clearRect(0, 0, ctxx.canvas.width, ctxx.canvas.height)
    ctxy.clearRect(0, 0, ctxy.canvas.width, ctxy.canvas.height)

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

    for (let y = 0; y < pArr.length; y++) {
      for (let x = 0; x < pArr[y].length; x++) {
        const val = 120 - (pArr[y][x] / maxp) * 120

        ctxp.fillStyle = `hsl(${val}, 100%, 50%)`
        ctxp.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
    }

    for (let i = 0; i < xArr.length; i++) {
      for (let j = 0; j < xArr[i].length; j++) {
        const vel = xArr[i][j]

        ctxx.fillStyle = `hsl(${Math.floor(240 - (vel / maxv) * 240)}, 100%, 50%)`
        ctxx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
    }

    for (let i = 0; i < yArr.length; i++) {
      for (let j = 0; j < yArr[i].length; j++) {
        const vel = yArr[i][j]

        ctxy.fillStyle = `hsl(${Math.floor(240 - (vel / maxv) * 240)}, 100%, 50%)`
        ctxy.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
    }

    document.querySelector('.xscale .min').textContent = '0'
    document.querySelector('.xscale .max').textContent = maxv.toFixed(5)

    document.querySelector('.yscale .min').textContent = '0'
    document.querySelector('.yscale .max').textContent = maxv.toFixed(5)

    document.querySelector('.pscale .min').textContent = '0'
    document.querySelector('.pscale .max').textContent = maxp.toFixed(5)
  }

  for (let i = 0; i < ctxpscale.canvas.width; i++) {
    ctxpscale.fillStyle = `hsl(${Math.floor(240 - (i / ctxpscale.canvas.width) * 240)}, 100%, 50%)`
    ctxpscale.fillRect(i, 0, 10, 50)
  }

  for (let i = 0; i < ctxxscale.canvas.width; i++) {
    ctxxscale.fillStyle = `hsl(${Math.floor(240 - (i / ctxxscale.canvas.width) * 240)}, 100%, 50%)`
    ctxxscale.fillRect(i, 0, 10, 50)
  }

  for (let i = 0; i < ctxyscale.canvas.width; i++) {
    ctxyscale.fillStyle = `hsl(${Math.floor(240 - (i / ctxyscale.canvas.width) * 240)}, 100%, 50%)`
    ctxyscale.fillRect(i, 0, 10, 50)
  }

  function execute () {
    if (running.checked) {
      for (let j = 1; j < ROWS - 1; j++) {
        state[j][0] = -2
        state[ROWS - 1 - j][COLS - 1] = 2
        prevX[j][0] = 0.00005
      }

      const h = (ROWS - 1) / 100

      for (let y = 0; y < prevX.length; y++) {
        for (let z = 0; z < prevX[y].length; z++) {
          let uTerm1 = (params.G / (2 * params.mu)) * (y / 100) * (h - (y / 100))
          nextX[y][z] = uTerm1
        }
        console.log(nextX[y][0])
      }

      draw(prevP, prevX, nextX)
    }
  }
  // setInterval(execute, 1000)
  requestAnimationFrame(execute)
}, false)
