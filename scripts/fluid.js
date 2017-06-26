'use strict'

window.addEventListener('DOMContentLoaded', function () {
  const CELL_SIZE = 10
  const COLS = 39
  const ROWS = 19

  const running = document.querySelector('.js-running')
  const ctxp = document.querySelector('.canvasp').getContext('2d')
  const ctxx = document.querySelector('.canvasx').getContext('2d')
  const ctxy = document.querySelector('.canvasy').getContext('2d')
  const ctxxscale = document.querySelector('.canvasxscale').getContext('2d')
  const ctxyscale = document.querySelector('.canvasyscale').getContext('2d')

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

  let oldP = zeros(ROWS, COLS)
  let newP

  let tempX
  let tempY
  let valsX
  let valsY

  let nextP
  let nextX
  let nextY

  const params = {
    gamma: 1.0, // interface diffusion
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

  function diffuse (f, constants) {
    const a = {
      n: constants.diffuse + (f.n > 0) * f.n, // a_n = D_n + max(F_n, 0)
      s: constants.diffuse + (-f.s > 0) * -f.s, // a_s = D_s + max(-F_s, 0)
      w: constants.diffuse + (f.w > 0) * f.w, // a_w = D_w + max(F_w, 0)
      e: constants.diffuse + (-f.e > 0) * -f.e // a_e = D_e + max(-F_e, 0)
    }

    return {
      n: a.n,
      s: a.s,
      w: a.w,
      e: a.e,
      c: a.n + a.s + a.w + a.e + (f.e - f.w + f.s - f.n) // a_c = a_n + a_s + a_w + a_e + dF
    }
  }

  function coefficients (xArr, yArr) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    const constants = {
      density: (params.rho / 2),
      diffuse: (params.gamma / params.size)
    }

    for (let j = 0; j < iArr.length; j++) {
      for (let i = 1; i < iArr[j].length - 1; i++) {
        const f = {
          n: constants.density * (yArr[j][i - 1] + yArr[j][i]),
          s: constants.density * (yArr[j + 1][i - 1] + yArr[j + 1][i]),
          w: constants.density * (xArr[j][i - 1] + xArr[j][i]),
          e: constants.density * (xArr[j][i] + xArr[j][i + 1])
        }

        iArr[j][i] = diffuse(f, constants)
      }
    }

    for (let j = 1; j < jArr.length - 1; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        const f = {
          n: constants.density * (yArr[j - 1][i] + yArr[j][i]),
          s: constants.density * (yArr[j][i] + yArr[j + 1][i]),
          w: constants.density * (xArr[j - 1][i] + xArr[j][i]),
          e: constants.density * (xArr[j - 1][i + 1] + xArr[j][i + 1])
        }

        jArr[j][i] = diffuse(f, constants)
      }
    }

    // west and east walls in x-axis
    for (let j = 0; j < ROWS; j++) {
      const fw = constants.density * (xArr[j][COLS - 1] + xArr[j][COLS])
      const fe = constants.density * (xArr[j][0] + xArr[j][1])

      iArr[j][COLS] = diffuse({ n: 0, s: 0, w: fw, e: 0 }, constants)
      iArr[j][0] = diffuse({ n: 0, s: 0, w: 0, e: fe }, constants)
    }

    // north and south walls in y-axis
    for (let i = 0; i < COLS; i++) {
      const fn = constants.density * (yArr[ROWS - 1][i] + yArr[ROWS][i])
      const fs = constants.density * (yArr[0][i] + yArr[1][i])

      jArr[ROWS][i] = diffuse({ n: fn, s: 0, w: 0, e: 0 }, constants)
      jArr[0][i] = diffuse({ n: 0, s: fs, w: 0, e: 0 }, constants)
    }

    return {
      x: iArr,
      y: jArr
    }
  }

  function couple (cArr, pArr, xArr, yArr, aX, aY) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    // performs velocity calculation in x-axis
    for (let j = 1; j < iArr.length - 1; j++) {
      for (let i = 1; i < iArr[j].length - 1; i++) {
        const vx = {
          n: aX[j][i].n * xArr[j - 1][i],
          s: aX[j][i].s * xArr[j + 1][i],
          w: aX[j][i].w * xArr[j][i - 1],
          e: aX[j][i].e * xArr[j][i + 1]
        }

        const ox = vx.n + vx.s + vx.w + vx.e + (pArr[j][i - 1] - pArr[j][i]) * params.size // + divergence

        iArr[j][i] = ox / aX[j][i].c
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 1; j < jArr.length - 1; j++) {
      for (let i = 1; i < jArr[j].length - 1; i++) {
        const vy = {
          n: aY[j][i].n * yArr[j - 1][i],
          s: aY[j][i].s * yArr[j + 1][i],
          w: aY[j][i].w * yArr[j][i - 1],
          e: aY[j][i].e * yArr[j][i + 1]
        }

        const oy = vy.n + vy.s + vy.w + vy.e + (pArr[j - 1][i] - pArr[j][i]) * params.size // + divergence

        jArr[j][i] = oy / aY[j][i].c
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
        n: aX[j][0].n * xArr[j - 1][0],
        s: aX[j][0].s * xArr[j + 1][0],
        e: aX[j][0].e * xArr[j][1]
      }

      iArr[j][0] += (bx * (vx.n + vx.s + xArr[j][0] + vx.e + (0 - pArr[j][0]) * params.size)) / aX[j][0].c // west wall inlets
    }

    // east edge
    for (let j = 1; j < ROWS - 1; j++) {
      const bx = cArr[j][COLS - 1] === 2

      const vx = {
        n: aX[j][COLS].n * xArr[j - 1][COLS],
        s: aX[j][COLS].s * xArr[j + 1][COLS],
        w: aX[j][COLS].w * xArr[j][COLS - 1]
      }

      iArr[j][COLS] += (bx * (vx.n + vx.s + vx.w + xArr[j][COLS] + (pArr[j][COLS - 1] - 0) * params.size)) / aX[j][COLS].c // east wall inlets
    }

    // north edge
    for (let i = 1; i < COLS - 1; i++) {
      const by = cArr[0][i] === 2

      const vy = {
        s: aY[0][i].s * yArr[1][i],
        w: aY[0][i].w * yArr[0][i - 1],
        e: aY[0][i].e * yArr[0][i + 1]
      }

      jArr[0][i] += (by * (yArr[0][i] + vy.s + vy.w + vy.e + (0 - pArr[0][i]) * params.size)) / aY[0][i].c // north wall inlets
    }

    // south edge
    for (let i = 1; i < COLS - 1; i++) {
      const by = cArr[ROWS - 1][i] === 2

      const vy = {
        n: aY[ROWS][i].n * yArr[ROWS - 1][i],
        w: aY[ROWS][i].w * yArr[ROWS][i - 1],
        e: aY[ROWS][i].e * yArr[ROWS][i + 1]
      }

      jArr[ROWS][i] += (by * (vy.n + yArr[ROWS][i] + vy.w + vy.e + (pArr[ROWS - 1][i] - 0) * params.size)) / aY[ROWS][i].c // south wall inlets
    }

    // TODO: write corner-cases

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
    for (let j = 0; j < iArr.length; j++) {
      for (let i = 1; i < iArr[j].length - 1; i++) {
        iArr[j][i] = xArr[j][i] + (pArr[j][i - 1] - pArr[j][i]) * params.size
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 1; j < jArr.length - 1; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        jArr[j][i] = yArr[j][i] + (pArr[j - 1][i] - pArr[j][i]) * params.size
      }
    }

    for (let j = 0; j < iArr.length; j++) {
      iArr[j][0] = xArr[j][0] + (0 - pArr[j][0]) * params.size
      iArr[j][COLS] = xArr[j][COLS] + (pArr[j][COLS - 1] - 0) * params.size
    }

    for (let i = 0; i < jArr[0].length; i++) {
      jArr[0][i] = yArr[0][i] + (0 - pArr[0][i]) * params.size
      jArr[ROWS][i] = yArr[ROWS][i] + (pArr[ROWS - 1][i] - 0) * params.size
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
        const val = 120 - (pArr[y][x] / maxp) * 120

        ctxp.fillStyle = `hsl(${val}, 100%, 50%)`
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

    document.querySelector('.xscale .min').textContent = '0'
    document.querySelector('.xscale .max').textContent = maxx.toFixed(5)

    document.querySelector('.yscale .min').textContent = '0'
    document.querySelector('.yscale .max').textContent = maxy.toFixed(5)
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
        state[j][0] = 1
        state[j][COLS - 1] = 2
        prevX[j][0] = 0.00005
      }

      let temp = coefficients(prevX, prevY)

      valsX = temp.x
      valsY = temp.y

      temp = couple(state, prevP, prevX, prevY, valsX, valsY)

      tempX = temp.x
      tempY = temp.y

      newP = jacobi(state, oldP, prevX, prevY)

      temp = correct(state, prevP, newP, tempX, tempY)

      nextX = temp.x
      nextY = temp.y
      nextP = temp.p

      for (let j = 1; j < ROWS - 1; j++) {
        nextX[j][0] = 0.00005
      }

      draw(nextP, nextX, nextY)

      prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
      prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
      prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out
    }

    requestAnimationFrame(execute)
  }
  // setInterval(execute, 1000)
  requestAnimationFrame(execute)
}, false)
