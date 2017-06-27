'use strict'

window.addEventListener('DOMContentLoaded', function () {
  const CELL_SIZE = 10
  const COLS = 79
  const ROWS = 19

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
  ctxy.canvas.width = COLS * CELL_SIZE + 1
  ctxy.canvas.height = (ROWS + 1) * CELL_SIZE + 1

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

  let tempX, tempY, valsX, valsY, nextP, nextX, nextY

  const params = {
    gamma: 0.2, // interface diffusion
    size: 0.01, // 10mm face area
    rho: 998.2, // 998.2kg/m^3 density
    mu: 0.001 // viscosity
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

  function coefficients (xArr, yArr) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    for (let j = 0; j < iArr.length; j++) {
      for (let i = 0; i < iArr[j].length; i++) {
        const f = {
          n: constants.density * (edge(yArr, j, i - 1) + edge(yArr, j, i)),
          s: constants.density * (edge(yArr, j + 1, i - 1) + edge(yArr, j + 1, i)),
          w: constants.density * (edge(xArr, j, i - 1) + edge(xArr, j, i)),
          e: constants.density * (edge(xArr, j, i) + edge(xArr, j, i + 1))
        }

        iArr[j][i] = diffuse(f)
      }
    }

    for (let j = 0; j < jArr.length; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        const f = {
          n: constants.density * (edge(yArr, j - 1, i) + edge(yArr, j, i)),
          s: constants.density * (edge(yArr, j, i) + edge(yArr, j + 1, i)),
          w: constants.density * (edge(xArr, j - 1, i) + edge(xArr, j, i)),
          e: constants.density * (edge(xArr, j - 1, i + 1) + edge(xArr, j, i + 1))
        }

        jArr[j][i] = diffuse(f)
      }
    }

    return {
      x: iArr,
      y: jArr
    }
  }

  function diffuse (f) {
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
      c: a.n + a.s + a.w + a.e + (f.e - f.w + f.s - f.n) // a_c = a_n + a_s + a_w + a_e +
    }
  }

  function momentum (xArr, yArr) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    const constants = {
      density: (params.rho / 2),
      diffuse: (params.gamma / params.size)
    }

    for (let j = 0; j < xArr.length; j++) {
      for (let i = 0; i < xArr[j].length; i++) {
        const f = {
          n: constants.density * (cell(yArr, j, i - 1) + cell(yArr, j, i)),
          s: constants.density * (cell(yArr, j + 1, i - 1) + cell(yArr, j + 1, i)),
          w: constants.density * (cell(xArr, j, i - 1) + cell(xArr, j, i)),
          e: constants.density * (cell(xArr, j, i) + cell(xArr, j, i + 1))
        }

        const a = {
          n: f.n > 0,
          s: f.s > 0,
          w: f.w > 0,
          e: f.e > 0
        }

        // positive r-values
        const rp = {
          n: (cell(xArr, j - 1, i) - cell(xArr, j - 2, i)) / (cell(xArr, j, i) - cell(xArr, j - 1, i)),
          s: (cell(xArr, j, i) - cell(xArr, j - 1, i)) / (cell(xArr, j + 1, i) - cell(xArr, j, i)),
          w: (cell(xArr, j, i - 1) - cell(xArr, j, i - 2)) / (cell(xArr, j, i) - cell(xArr, j, i - 1)),
          e: (cell(xArr, j, i) - cell(xArr, j, i - 1)) / (cell(xArr, j, i + 1) - cell(xArr, j, i))
        }

        // negative r-values
        const rn = {
          n: (cell(xArr, j - 1, i) - cell(xArr, j, i)) / (cell(xArr, j, i) - cell(xArr, j + 1, i)),
          s: (cell(xArr, j - 2, i) - cell(xArr, j - 1, i)) / (cell(xArr, j - 1, i) - cell(xArr, j, i)),
          w: (cell(xArr, j, i - 1) - cell(xArr, j, i)) / (cell(xArr, j, i) - cell(xArr, j, i + 1)),
          e: (cell(xArr, j, i - 2) - cell(xArr, j, i - 1)) / (cell(xArr, j, i - 1) - cell(xArr, j, i))
        }

        // flux constituents
        const fx = {
          n: f.n * (a.n * psi(rp.n) - (1 - a.n) * psi(rn.n)) * (cell(xArr, j, i) - cell(xArr, j - 1, i)),
          s: f.s * ((1 - a.s) * psi(rn.s) - a.s * psi(rp.s)) * (cell(xArr, j + 1, i) - cell(xArr, j, i)),
          w: f.w * (a.w * psi(rp.w) - (1 - a.w) * psi(rn.w)) * (cell(xArr, j, i) - cell(xArr, j, i - 1)),
          e: f.e * ((1 - a.e) * psi(rn.e) - a.e * psi(rp.e)) * (cell(xArr, j, i + 1) - cell(xArr, j, i))
        }

        iArr[j][i] = (fx.n + fx.s + fx.w + fx.e) / 2
      }
    }

    for (let j = 0; j < jArr.length; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        const f = {
          n: constants.density * (cell(yArr, j, i - 1) + cell(yArr, j, i)),
          s: constants.density * (cell(yArr, j + 1, i - 1) + cell(yArr, j + 1, i)),
          w: constants.density * (cell(xArr, j, i - 1) + cell(xArr, j, i)),
          e: constants.density * (cell(xArr, j, i) + cell(xArr, j, i + 1))
        }

        const a = {
          n: f.n > 0,
          s: f.s > 0,
          w: f.w > 0,
          e: f.e > 0
        }

        // positive r-values
        const rp = {
          n: (cell(yArr, j - 1, i) - cell(yArr, j - 2, i)) / (cell(yArr, j, i) - cell(yArr, j - 1, i)),
          s: (cell(yArr, j, i) - cell(yArr, j - 1, i)) / (cell(yArr, j + 1, i) - cell(yArr, j, i)),
          w: (cell(yArr, j, i - 1) - cell(yArr, j, i - 2)) / (cell(yArr, j, i) - cell(yArr, j, i - 1)),
          e: (cell(yArr, j, i) - cell(yArr, j, i - 1)) / (cell(yArr, j, i + 1) - cell(yArr, j, i))
        }

        // negative r-values
        const rn = {
          n: (cell(yArr, j - 1, i) - cell(yArr, j, i)) / (cell(yArr, j, i) - cell(yArr, j + 1, i)),
          s: (cell(yArr, j - 2, i) - cell(yArr, j - 1, i)) / (cell(yArr, j - 1, i) - cell(yArr, j, i)),
          w: (cell(yArr, j, i - 1) - cell(yArr, j, i)) / (cell(yArr, j, i) - cell(yArr, j, i + 1)),
          e: (cell(yArr, j, i - 2) - cell(yArr, j, i - 1)) / (cell(yArr, j, i - 1) - cell(yArr, j, i))
        }

        // flux constituents
        const fy = {
          n: f.n * (a.n * psi(rp.n) - (1 - a.n) * psi(rn.n)) * (cell(yArr, j, i) - cell(yArr, j - 1, i)),
          s: f.s * ((1 - a.s) * psi(rn.s) - a.s * psi(rp.s)) * (cell(yArr, j + 1, i) - cell(yArr, j, i)),
          w: f.w * (a.w * psi(rp.w) - (1 - a.w) * psi(rn.w)) * (cell(yArr, j, i) - cell(yArr, j, i - 1)),
          e: f.e * ((1 - a.e) * psi(rn.e) - a.e * psi(rp.e)) * (cell(yArr, j, i + 1) - cell(yArr, j, i))
        }

        jArr[j][i] = (fy.n + fy.s + fy.w + fy.e) / 2
      }
    }

    return {
      x: iArr,
      y: jArr
    }
  }

  function psi (v) {
    return v // TODO: implement proper psi function
  }

  function couple (pArr, xArr, yArr, aX, aY) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    // let {
    //   x: uArr,
    //   y: vArr
    // } = momentum(xArr, yArr)

    // performs velocity calculation in x-axis
    for (let j = 0; j < iArr.length; j++) {
      for (let i = 0; i < iArr[j].length; i++) {
        const vx = {
          n: aX[j][i].n * edge(xArr, j - 1, i),
          s: aX[j][i].s * edge(xArr, j + 1, i),
          w: aX[j][i].w * edge(xArr, j, i - 1),
          e: aX[j][i].e * edge(xArr, j, i + 1)
        }

        // TODO: generalise state for all axes
        const wx = cell(state, j, i) === 2 ||
                   cell(state, j, i - 1) === 2 ||
                  (cell(state, j, i) !== 0 &&
                   cell(state, j - 1, i) !== 0 &&
                   cell(state, j + 1, i) !== 0 &&
                   cell(state, j, i - 1) !== 0 &&
                   cell(state, j - 1, i - 1) !== 0 &&
                   cell(state, j + 1, i - 1) !== 0)

        const ox = (vx.n + vx.s + vx.w + vx.e + (cell(pArr, j, i - 1) - cell(pArr, j, i)) * params.size) * wx // + uArr[j][i]

        iArr[j][i] = ox / aX[j][i].c
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 0; j < jArr.length; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        const vy = {
          n: aY[j][i].n * edge(yArr, j - 1, i),
          s: aY[j][i].s * edge(yArr, j + 1, i),
          w: aY[j][i].w * edge(yArr, j, i - 1),
          e: aY[j][i].e * edge(yArr, j, i + 1)
        }

        const wy = cell(state, j, i) === 2 ||
                   cell(state, j - 1, i) === 2 ||
                  (cell(state, j, i) !== 0 &&
                   cell(state, j, i - 1) !== 0 &&
                   cell(state, j, i + 1) !== 0 &&
                   cell(state, j - 1, i) !== 0 &&
                   cell(state, j - 1, i - 1) !== 0 &&
                   cell(state, j - 1, i + 1) !== 0)

        const oy = (vy.n + vy.s + vy.w + vy.e + (cell(pArr, j - 1, i) - cell(pArr, j, i)) * params.size) * wy // + vArr[j][i]

        jArr[j][i] = oy / aY[j][i].c
      }
    }

    // traverses y-axis and sets x-edge values
    for (let j = 0; j < ROWS; j++) {
      const bool = {
        w: state[j][0] === -2,
        e: state[j][COLS - 1] === -2
      }

      iArr[j][0] += bool.w * 0.00005 // west wall inlets
      iArr[j][COLS] -= bool.e * 0.00005 // east wall inlets
    }

    // traverses x-axis and sets y-edge values
    for (let i = 0; i < COLS; i++) {
      const bool = {
        n: state[0][i] === -2,
        s: state[ROWS - 1][i] === -2
      }

      jArr[0][i] += bool.n * 0.00005 // north wall inlets
      jArr[ROWS][i] -= bool.s * 0.00005 // south wall inlets
    }

    return {
      x: iArr,
      y: jArr
    }
  }

  function jacobi (pArr, xArr, yArr) {
    let kArr = zeros(ROWS, COLS)

    for (let j = 0; j < kArr.length; j++) {
      for (let i = 0; i < kArr[j].length; i++) {
        const vx = {
          w: cell(xArr, j, i),
          e: cell(xArr, j, i + 1)
        }

        const vy = {
          n: cell(yArr, j, i),
          s: cell(yArr, j + 1, i)
        }

        const p = {
          n: cell(pArr, j - 1, i),
          s: cell(pArr, j + 1, i),
          w: cell(pArr, j, i - 1),
          e: cell(pArr, j, i + 1)
        }

        kArr[j][i] = p.n + p.s + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
      }
    }

    return kArr
  }

  function correct (pArr, qArr, xArr, yArr, xA, yA) {
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
        iArr[j][i] = cell(xArr, j, i) + (pArr[j][i - 1] - pArr[j][i]) * params.size
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 1; j < jArr.length - 1; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        jArr[j][i] = cell(yArr, j, i) + (pArr[j - 1][i] - pArr[j][i]) * params.size
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

  function converge (xArr, yArr, iArr, jArr) {
    let diff = 0
    let step = 0

    for (let j = 0; j < state.length; j++) {
      for (let i = 0; i < state[j].length; i++) {
        step += state[j][i] !== 0 // increments if cell isn't a wall
      }
    }

    for (let j = 0; j < xArr.length; j++) {
      for (let i = 0; i < xArr[j].length; i++) {
        diff += Math.abs(Math.abs(xArr[j][i]) - Math.abs(iArr[j][i]))
      }
    }

    for (let j = 0; j < yArr.length; j++) {
      for (let i = 0; i < yArr[j].length; i++) {
        diff += Math.abs(Math.abs(yArr[j][i]) - Math.abs(jArr[j][i]))
      }
    }

    return diff / step
  }

  function execute () {
    if (running.checked) {
      for (let j = 1; j < ROWS - 1; j++) {
        state[j][0] = -2
        state[ROWS - 1 - j][COLS - 1] = 2
        prevX[j][0] = 0.00005
      }

      let temp = coefficients(prevX, prevY)

      valsX = temp.x
      valsY = temp.y

      temp = couple(prevP, prevX, prevY, valsX, valsY)

      tempX = temp.x
      tempY = temp.y

      newP = jacobi(oldP, prevX, prevY)

      for (let j = 1; j < ROWS - 1; j++) {
        tempX[j][0] = 0.00005
      }

      temp = correct(prevP, newP, tempX, tempY, valsX, valsY)

      nextX = temp.x
      nextY = temp.y
      nextP = temp.p

      for (let j = 1; j < ROWS - 1; j++) {
        nextX[j][0] = 0.00005
      }

      draw(nextP, nextX, nextY)

      // invokes next animation frame if convergence is above threshold
      if (converge(nextX, nextY, prevX, prevY) > 0.000000001) {
        prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
        prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
        prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out

        requestAnimationFrame(execute)
      }
    }
  }
  // setInterval(execute, 1000)
  requestAnimationFrame(execute)
}, false)
