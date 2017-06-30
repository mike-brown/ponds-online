'use strict'

window.addEventListener('DOMContentLoaded', function () {
  const CELL_SIZE = 10
  const COLS = 79
  const ROWS = 19

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

  let prevP = zeros(ROWS, COLS) //     ( 9R, 27C)
  let prevX = zeros(ROWS, COLS + 1) // ( 9R, 28C)
  let prevY = zeros(ROWS + 1, COLS) // (10R, 27C)

  let primeP = zeros(ROWS, COLS)

  let tempX, tempY, valsX, valsY, nextP, nextX, nextY

  for (let j = 1; j < state.length - 1; j++) {
    for (let i = 1; i < state[j].length - 1; i++) {
      state[j][i] = 1 // sets all inner cells to water cells
    }
  }

  for (let j = 2; j < ROWS - 2; j++) {
    state[j][1] = -2
    state[ROWS - 1 - j][COLS - 2] = 2
    // state[ROWS - 1 - j][COLS - 1] = 0
  }

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

  function edge (arr, j, i, dj, di) {
    const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
    const mj = Math.max(Math.min(j, arr.length - 1), 0)
    const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
    const mdj = Math.max(Math.min(dj, arr.length - 1), 0)
    const wz = cell(state, j, i) !== 0 // returns zero if wall

    // returns cell on closest edge of array, based on supplied j and i values
    return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
  }

  function cell (arr, j, i) {
    const bx = (i >= 0) && (i < arr[0].length)
    const by = (j >= 0) && (j < arr.length)
    const bz = bx && by

    // returns zero if cell does not fall within the supplied array range
    return arr[Math.max(Math.min(j, arr.length - 1), 0)][Math.max(Math.min(i, arr[0].length - 1), 0)] * bz
  }

  function coefficients (xArr, yArr) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    for (let j = 0; j < iArr.length; j++) {
      for (let i = 0; i < iArr[j].length; i++) {
        const f = {
          n: constants.density * (edge(yArr, j, i - 1, j, i) + edge(yArr, j, i, j, i)),
          s: constants.density * (edge(yArr, j + 1, i - 1, j, i) + edge(yArr, j + 1, i, j, i)),
          w: constants.density * (edge(xArr, j, i - 1, j, i) + edge(xArr, j, i, j, i)),
          e: constants.density * (edge(xArr, j, i, j, i) + edge(xArr, j, i + 1, j, i))
        }

        iArr[j][i] = diffuse(f)
      }
    }

    for (let j = 0; j < jArr.length; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        const f = {
          n: constants.density * (edge(yArr, j - 1, i, j, i) + edge(yArr, j, i, j, i)),
          s: constants.density * (edge(yArr, j, i, j, i) + edge(yArr, j + 1, i, j, i)),
          w: constants.density * (edge(xArr, j - 1, i, j, i) + edge(xArr, j, i, j, i)),
          e: constants.density * (edge(xArr, j - 1, i + 1, j, i) + edge(xArr, j, i + 1, j, i))
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
      n: constants.diffuse + Math.max(f.n, 0), // a_n = D_n + max(F_n, 0)
      s: constants.diffuse + Math.max(-f.s, 0), // a_s = D_s + max(-F_s, 0)
      w: constants.diffuse + Math.max(f.w, 0), // a_w = D_w + max(F_w, 0)
      e: constants.diffuse + Math.max(-f.e, 0) // a_e = D_e + max(-F_e, 0)
    }

    return {
      n: a.n,
      s: a.s,
      w: a.w,
      e: a.e,
      c: a.n + a.s + a.w + a.e + (f.e - f.w) + (f.s - f.n) // a_c = a_n + a_s + a_w + a_e +
    }
  }

  function couple (pArr, xArr, yArr, aX, aY) {
    let iArr = zeros(ROWS, COLS + 1)
    let jArr = zeros(ROWS + 1, COLS)

    // performs velocity calculation in x-axis
    for (let j = 0; j < iArr.length; j++) {
      for (let i = 0; i < iArr[j].length; i++) {
        const vx = {
          n: aX[j][i].n * edge(xArr, j - 1, i, j, i),
          s: aX[j][i].s * edge(xArr, j + 1, i, j, i),
          w: aX[j][i].w * edge(xArr, j, i - 1, j, i),
          e: aX[j][i].e * edge(xArr, j, i + 1, j, i)
        }

        const wx = (cell(state, j, i - 1) === 0 && cell(state, j, i) === 2) ||
                   (cell(state, j, i - 1) === 2 && cell(state, j, i) === 0) ||
                   (cell(state, j, i) !== 0 &&
                    cell(state, j - 1, i) !== 0 &&
                    cell(state, j + 1, i) !== 0 &&
                    cell(state, j, i - 1) !== 0 &&
                    cell(state, j - 1, i - 1) !== 0 &&
                    cell(state, j + 1, i - 1) !== 0)

        // returns true if inlet cell adjacent to wall in x-axis
        const inL = cell(state, j, i - 1) === 0 && cell(state, j, i) === -2
        const inR = cell(state, j, i) === 0 && cell(state, j, i - 1) === -2

        const outX = (vx.n + vx.s + vx.w + vx.e + (cell(pArr, j, i - 1) - cell(pArr, j, i)) * params.size) * wx // + uArr[j][i]

        iArr[j][i] = (outX * !(inL || inR)) / aX[j][i].c + (inL ^ inR) * 0.00005 // either returns calculated value or inlet value
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 0; j < jArr.length; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        const vy = {
          n: aY[j][i].n * edge(yArr, j - 1, i, j, i),
          s: aY[j][i].s * edge(yArr, j + 1, i, j, i),
          w: aY[j][i].w * edge(yArr, j, i - 1, j, i),
          e: aY[j][i].e * edge(yArr, j, i + 1, j, i)
        }

        const wy = (cell(state, j - 1, i) === 0 && cell(state, j, i) === 2) ||
                   (cell(state, j - 1, i) === 2 && cell(state, j, i) === 0) ||
                   (cell(state, j, i) !== 0 &&
                    cell(state, j, i - 1) !== 0 &&
                    cell(state, j, i + 1) !== 0 &&
                    cell(state, j - 1, i) !== 0 &&
                    cell(state, j - 1, i - 1) !== 0 &&
                    cell(state, j - 1, i + 1) !== 0)

        // returns true if inlet cell adjacent to wall in y-axis
        const inU = cell(state, j - 1, i) === 0 && cell(state, j, i) === -2
        const inD = cell(state, j, i) === 0 && cell(state, j - 1, i) === -2

        const outY = (vy.n + vy.s + vy.w + vy.e + (cell(pArr, j - 1, i) - cell(pArr, j, i)) * params.size) * wy // + vArr[j][i]

        jArr[j][i] = (outY * !(inU || inD)) / aY[j][i].c + (inU ^ inD) * 0.00005 // either returns calculated value or inlet value
      }
    }

    return {
      x: iArr,
      y: jArr
    }
  }

  function jacobi (pArr, xArr, yArr, xA, yA) {
    const kArr = zeros(ROWS, COLS)

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

        const a = {
          n: yA[j][i].c,
          s: yA[j + 1][i].c,
          w: xA[j][i].c,
          e: xA[j][i + 1].c
        }

        let pSub1 = p.n / a.n + p.s / a.s + p.w / a.w + p.e / a.e // a_nP'_n + a_sP'_s + a_wP'_w + a_eP'_e
        let pSub2 = (vx.w - vx.e + vy.n - vy.s) / params.size // b_ij
        let pSub3 = (1 / a.n + 1 / a.s + 1 / a.w + 1 / a.e)

        kArr[j][i] = (pSub1 + pSub2 / pSub3) * (cell(state, j, i) !== 0)

        // kArr[j][i] = p.n + p.s + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
      }
    }

    return kArr
  }

  function correct (pArr, qArr, xArr, yArr, xA, yA) {
    const iArr = zeros(ROWS, COLS + 1)
    const jArr = zeros(ROWS + 1, COLS)
    const kArr = zeros(ROWS, COLS)

    // performs velocity calculation in x-axis
    for (let j = 0; j < kArr.length; j++) {
      for (let i = 0; i < kArr[j].length; i++) {
        kArr[j][i] = (pArr[j][i] + qArr[j][i])
      }
    }

    // performs velocity calculation in x-axis
    for (let j = 0; j < iArr.length; j++) {
      for (let i = 0; i < iArr[j].length; i++) {
        // returns true if inlet cell adjacent to wall in x-axis
        const inL = cell(state, j, i - 1) === 0 && cell(state, j, i) === -2
        const inR = cell(state, j, i - 1) === -2 && cell(state, j, i) === 0

        const wx = (cell(state, j, i - 1) === 0 && cell(state, j, i) === 2) ||
                   (cell(state, j, i - 1) === 2 && cell(state, j, i) === 0) ||
                   (cell(state, j, i) !== 0 &&
                    cell(state, j - 1, i) !== 0 &&
                    cell(state, j + 1, i) !== 0 &&
                    cell(state, j, i - 1) !== 0 &&
                    cell(state, j - 1, i - 1) !== 0 &&
                    cell(state, j + 1, i - 1) !== 0)

        const outX = cell(xArr, j, i) + (cell(qArr, j, i - 1) - cell(qArr, j, i)) * (params.size / xA[j][i].c)

        iArr[j][i] = wx * outX * !(inL || inR) + (inL ^ inR) * 0.00005 // either returns calculated value or inlet value
      }
    }

    // performs velocity calculation in y-axis
    for (let j = 0; j < jArr.length; j++) {
      for (let i = 0; i < jArr[j].length; i++) {
        // returns true if inlet cell adjacent to wall in y-axis

        const inU = cell(state, j - 1, i) === 0 && cell(state, j, i) === -2
        const inD = cell(state, j - 1, i) === -2 && cell(state, j, i) === 0

        const outY = cell(yArr, j, i) + (cell(qArr, j - 1, i) - cell(qArr, j, i)) * (params.size / yA[j][i].c)

        jArr[j][i] = outY * !(inU || inD) + (inU ^ inD) * 0.00005 // either returns calculated value or inlet value
      }
    }

    return {
      x: iArr,
      y: jArr,
      p: kArr
    }
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

        ctxp.fillStyle = `hsl(${val}, 100%, ${50 * (cell(state, y, x) !== 0)}%)`
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
      let temp = coefficients(prevX, prevY)

      valsX = temp.x
      valsY = temp.y

      temp = couple(prevP, prevX, prevY, valsX, valsY)

      tempX = temp.x
      tempY = temp.y

      primeP = jacobi(primeP, tempX, tempY, valsX, valsY)

      temp = correct(prevP, primeP, tempX, tempY, valsX, valsY)

      nextP = temp.p
      nextX = temp.x
      nextY = temp.y

      draw(nextP, nextX, nextY)

      // invokes next animation frame if convergence is above threshold
      if (converge(nextX, nextY, prevX, prevY) > 0.000000001) {
        prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
        prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
        prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out

        requestAnimationFrame(execute)
      } else {
        for (let j = 0; j < nextX[0].length; j++) {
          console.log(nextX[9][j])
        }
      }
    }
  }
  // setInterval(execute, 1000)
  requestAnimationFrame(execute)
}, false)
