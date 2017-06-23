'use strict'

window.addEventListener('DOMContentLoaded', function () {
  const CELL_SIZE = 10
  const COLS = 39
  const ROWS = 19

  const running = document.querySelector('.js-running')
  const ctxp = document.querySelector('.canvasp').getContext('2d')
  const ctxx = document.querySelector('.canvasx').getContext('2d')
  const ctxy = document.querySelector('.canvasy').getContext('2d')

  ctxp.canvas.width = COLS * CELL_SIZE + 1
  ctxp.canvas.height = ROWS * CELL_SIZE + 1
  ctxx.canvas.width = (COLS + 1) * CELL_SIZE + 1
  ctxx.canvas.height = ROWS * CELL_SIZE + 1
  ctxy.canvas.width = COLS * CELL_SIZE + 1
  ctxy.canvas.height = (ROWS + 1) * CELL_SIZE + 1

  let state = zeros(ROWS, COLS)

  let prevP = zeros(ROWS, COLS) //     ( 9R, 27C)
  let prevX = zeros(ROWS, COLS + 1) // ( 9R, 28C)
  let prevY = zeros(ROWS + 1, COLS) // (10R, 27C)

  for (let j = 1; j < ROWS - 1; j++) {
    state[j][0] = 1
    state[j][COLS - 1] = 2
    prevX[j][0] = 0.00005
  }

  let oldP = zeros(ROWS, COLS)
  let newP

  let tempX
  let tempY

  let nextP
  let nextX
  let nextY

  const params = {
    size: 0.01, // 10mm face area
    rho: 998.2, // 998.2kg/m^3 density
    mu: 0.0 // viscosity
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

  function coefficients (xArr, yArr) {
    return {
      n: 0,
      s: 0,
      w: 0,
      e: 0
    }
  }

  function couple (cArr, pArr, xArr, yArr) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    // performs velocity calculation in x-axis
    for (let j = 1; j < iArr.length - 1; j++) {
      for (let i = 1; i < iArr[j].length - 1; i++) {
        const vx = {
          n: xArr[j - 1][i],
          s: xArr[j + 1][i],
          w: xArr[j][i - 1],
          e: xArr[j][i + 1]
        }

        const ox = vx.n + vx.s + vx.w + vx.e + (pArr[j][i - 1] - pArr[j][i]) * params.size // + divergence

        iArr[j][i] = ox
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 1; j < jArr.length - 1; j++) {
      for (let i = 1; i < jArr[j].length - 1; i++) {
        const vy = {
          n: yArr[j - 1][i],
          s: yArr[j + 1][i],
          w: yArr[j][i - 1],
          e: yArr[j][i + 1]
        }

        const oy = vy.n + vy.s + vy.w + vy.e + (pArr[j - 1][i] - pArr[j][i]) * params.size // + divergence

        jArr[j][i] = oy
      }
    }

    // traverses y-axis and sets x-edge values
    for (let j = 0; j < ROWS; j++) {
      const bool = {
        w: cArr[j][0] === 1,
        e: cArr[j][COLS - 1] === 1
      }

      iArr[j][0] += bool.w * 0.00005 // west wall inlets

      iArr[j][COLS] -= bool.e * 0.00005 // east wall inlets
    }

    // traverses x-axis and sets y-edge values
    for (let i = 0; i < COLS; i++) {
      const bool = {
        n: cArr[0][i] === 1,
        s: cArr[ROWS - 1][i] === 1
      }

      jArr[0][i] += bool.n * 0.00005 // north wall inlets

      jArr[ROWS][i] -= bool.s * 0.00005 // south wall inlets
    }

    // west edge
    for (let j = 1; j < ROWS - 1; j++) {
      const bx = cArr[j][0] === 2

      const vx = {
        n: xArr[j - 1][0],
        s: xArr[j + 1][0],
        e: xArr[j][1]
      }

      iArr[j][0] = bx * (vx.n + vx.s + xArr[j][0] + vx.e + (0 - pArr[j][0]) * params.size) // west wall inlets
    }

    // east edge
    for (let j = 1; j < ROWS - 1; j++) {
      const bx = cArr[j][COLS - 1] === 2

      const vx = {
        n: xArr[j - 1][COLS],
        s: xArr[j + 1][COLS],
        w: xArr[j][COLS - 1]
      }

      iArr[j][COLS] = bx * (vx.n + vx.s + vx.w + xArr[j][COLS] + (pArr[j][COLS - 1] - 0) * params.size) // east wall inlets
    }

    // north edge
    for (let i = 1; i < COLS - 1; i++) {
      const by = cArr[0][i] === 2

      const vy = {
        s: yArr[1][i],
        w: yArr[0][i - 1],
        e: yArr[0][i + 1]
      }

      jArr[0][i] = by * (yArr[0][i] + vy.s + vy.w + vy.e + (0 - pArr[0][i]) * params.size) // north wall inlets
    }

    // south edge
    for (let i = 1; i < COLS - 1; i++) {
      const by = cArr[ROWS - 1][i] === 2

      const vy = {
        n: yArr[ROWS - 1][i],
        w: yArr[ROWS][i - 1],
        e: yArr[ROWS][i + 1]
      }

      jArr[ROWS][i] = by * (vy.n + yArr[ROWS][i] + vy.w + vy.e + (pArr[ROWS - 1][i] - 0) * params.size) // south wall inlets
    }

    return {
      x: iArr,
      y: jArr
    }
  }

  function jacobi (cArr, pArr, xArr, yArr) {
    let kArr = zeros(ROWS, COLS)

    for (let j = 1; j < kArr.length - 1; j++) {
      for (let i = 1; i < kArr[j].length - 1; i++) {
        const vx = {
          w: xArr[j][i],
          e: xArr[j][i + 1]
        }

        const vy = {
          n: yArr[j][i],
          s: yArr[j + 1][i]
        }

        const p = {
          n: pArr[j - 1][i],
          s: pArr[j + 1][i],
          w: pArr[j][i - 1],
          e: pArr[j][i + 1]
        }

        kArr[j][i] = p.n + p.s + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
      }
    }

    // west bank
    for (let j = 1; j < ROWS - 1; j++) {
      const vx = {
        w: xArr[j][0],
        e: xArr[j][1]
      }

      const vy = {
        n: yArr[j][0],
        s: yArr[j + 1][0]
      }

      const p = {
        n: pArr[j - 1][0],
        s: pArr[j + 1][0],
        e: pArr[j][1]
      }

      kArr[j][0] = p.n + p.s + p.e + (vx.w - vx.e + vy.n - vy.s)
    }

    // east bank
    for (let j = 1; j < ROWS - 1; j++) {
      const vx = {
        w: xArr[j][COLS - 1],
        e: xArr[j][COLS]
      }

      const vy = {
        n: yArr[j][COLS - 1],
        s: yArr[j + 1][COLS - 1]
      }

      const p = {
        n: pArr[j - 1][COLS - 1],
        s: pArr[j + 1][COLS - 1],
        w: pArr[j][COLS - 2]
      }

      kArr[j][COLS - 1] = p.n + p.s + p.w + (vx.w - vx.e + vy.n - vy.s)
    }

    // north bank
    for (let i = 1; i < COLS - 1; i++) {
      const vx = {
        w: xArr[0][i],
        e: xArr[0][i + 1]
      }

      const vy = {
        n: yArr[0][i],
        s: yArr[1][i]
      }

      const p = {
        s: pArr[1][i],
        w: pArr[0][i - 1],
        e: pArr[0][i + 1]
      }

      kArr[0][i] = p.s + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
    }

    // south bank
    for (let i = 1; i < COLS - 1; i++) {
      const vx = {
        w: xArr[ROWS - 1][i],
        e: xArr[ROWS - 1][i + 1]
      }

      const vy = {
        n: yArr[ROWS - 1][i],
        s: yArr[ROWS][i]
      }

      const p = {
        n: pArr[ROWS - 2][i],
        w: pArr[ROWS - 1][i - 1],
        e: pArr[ROWS - 1][i + 1]
      }

      kArr[ROWS - 1][i] = p.n + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
    }

    // north-west corner
    {
      const vx = {
        w: xArr[0][0],
        e: xArr[0][1]
      }

      const vy = {
        n: yArr[0][0],
        s: yArr[1][0]
      }

      const p = {
        s: pArr[1][0],
        e: pArr[0][1]
      }

      kArr[0][0] = p.s + p.e + (vx.w - vx.e + vy.n - vy.s)
    }

    // north-east corner
    {
      const vx = {
        w: xArr[0][COLS - 1],
        e: xArr[0][COLS]
      }

      const vy = {
        n: yArr[0][COLS - 1],
        s: yArr[1][COLS - 1]
      }

      const p = {
        s: pArr[1][COLS - 1],
        w: pArr[0][COLS - 2]
      }

      kArr[0][COLS - 1] = p.s + p.w + (vx.w - vx.e + vy.n - vy.s)
    }

    // south-west corner
    {
      const vx = {
        w: xArr[ROWS - 1][0],
        e: xArr[ROWS - 1][1]
      }

      const vy = {
        n: yArr[ROWS - 1][0],
        s: yArr[ROWS][0]
      }

      const p = {
        n: pArr[ROWS - 2][0],
        e: pArr[ROWS - 1][1]
      }

      kArr[ROWS - 1][0] = p.n + p.e + (vx.w - vx.e + vy.n - vy.s)
    }

    // south-east corner
    {
      const vx = {
        w: xArr[ROWS - 1][COLS - 1],
        e: xArr[ROWS - 1][COLS]
      }

      const vy = {
        n: yArr[ROWS - 1][COLS - 1],
        s: yArr[ROWS][COLS - 1]
      }

      const p = {
        n: pArr[ROWS - 2][COLS - 1],
        w: pArr[ROWS - 1][COLS - 2]
      }

      kArr[ROWS - 1][COLS - 1] = p.n + p.w + (vx.w - vx.e + vy.n - vy.s)
    }

    // TODO: write corner-cases

    return kArr
  }

  function correct (cArr, pArr, qArr, xArr, yArr) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)
    let kArr = zeros(ROWS, COLS)

    // performs velocity calculation in x-axis
    for (let j = 0; j < kArr.length; j++) {
      for (let i = 0; i < kArr[j].length; i++) {
        kArr[j][i] = pArr[j][i] + qArr[j][i]
      }
    }

    // performs velocity calculation in x-axis
    for (let j = 1; j < iArr.length - 1; j++) {
      for (let i = 1; i < iArr[j].length - 1; i++) {
        iArr[j][i] = xArr[j][i] + (pArr[j][i - 1] - pArr[j][i]) * params.size
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 1; j < jArr.length - 1; j++) {
      for (let i = 1; i < jArr[j].length - 1; i++) {
        jArr[j][i] = yArr[j][i] + (pArr[j - 1][i] - pArr[j][i]) * params.size
      }
    }

    return {
      x: iArr,
      y: jArr,
      p: kArr
    }
  }

  function draw (pArr, xArr, yArr) {
    ctxp.clearRect(0, 0, ctxp.canvas.width, ctxp.canvas.height)
    ctxx.clearRect(0, 0, ctxx.canvas.width, ctxx.canvas.height)
    ctxx.clearRect(0, 0, ctxy.canvas.width, ctxy.canvas.height)

    let maxp = 0
    let maxx = 0
    let maxy = 0

    for (let y = 0; y < pArr.length; y++) {
      for (let x = 0; x < pArr[y].length; x++) {
        if (maxp < Math.abs(pArr[y][x])) {
          maxp = Math.abs(pArr[y][x])
        }
      }
    }

    for (let y = 0; y < xArr.length; y++) {
      for (let x = 0; x < xArr[y].length; x++) {
        if (maxx < Math.abs(xArr[y][x])) {
          maxx = Math.abs(xArr[y][x])
        }
      }
    }

    for (let y = 0; y < yArr.length; y++) {
      for (let x = 0; x < yArr[y].length; x++) {
        if (maxy < Math.abs(yArr[y][x])) {
          maxy = Math.abs(yArr[y][x])
        }
      }
    }

    let valp = (maxp === 0) ? 0 : 255.0 / maxp
    let valv = (maxx === 0) ? 0 : 255.0 / (maxx > maxy ? maxx : maxy)

    for (let y = 0; y < pArr.length; y++) {
      for (let x = 0; x < pArr[y].length; x++) {
        ctxp.fillStyle = 'rgb(' + parseInt(255 - valp * Math.abs(pArr[y][x])) + ', ' + parseInt(255 - valp * Math.abs(pArr[y][x])) + ', 255)'
        ctxp.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
    }

    for (let i = 0; i < xArr.length; i++) {
      for (let j = 0; j < xArr[i].length; j++) {
        const vel = xArr[i][j]

        ctxx.fillStyle = `hsl(${Math.floor(240 - (vel / maxx) * 240)}, 100%, 50%)`
        ctxx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
    }

    for (let i = 0; i < yArr.length; i++) {
      for (let j = 0; j < yArr[i].length; j++) {
        const vel = yArr[i][j]

        ctxy.fillStyle = `hsl(${Math.floor(240 - (vel / maxy) * 240)}, 100%, 50%)`
        ctxy.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
      }
    }
  }

  function execute () {
    if (running.checked) {
      let temp = couple(state, prevP, prevX, prevY)

      // console.log('New Estimated Velocity:', temp)

      tempX = temp.x
      tempY = temp.y

      newP = jacobi(state, oldP, prevX, prevY)

      // console.log('New Estimated Pressure:', newP)

      temp = correct(state, prevP, newP, tempX, tempY)

      nextX = temp.x
      nextY = temp.y
      nextP = temp.p

      // console.log('New Estimated Component:', temp)

      draw(nextP, nextX, nextY)

      prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
      prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
      prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out
    }

    requestAnimationFrame(execute)
  }

  // setInterval(execute, 200)
  requestAnimationFrame(execute)
}, false)
