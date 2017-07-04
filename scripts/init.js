'use strict'

const {
  zeros,
  cell,
  slot,
  diffuse,
  viscosity
} = require('./fluid')

const {
  CELL_SIZE,
  COLS,
  ROWS,
  params,
  values,
  plants
} = require('./config')

window.addEventListener(
  'DOMContentLoaded',
  function () {
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

    for (let j = 0; j < state.length - 0; j++) {
      for (let i = 0; i < state[j].length - 0; i++) {
        state[j][i] = 10// + (j > 9) // sets all inner cells to water cells
        // prevX[j][i] = params.input.x
      }
    }

    for (let j = 1; j < ROWS - 1; j++) {
      state[j][0] = 1
      state[ROWS - 1 - j][COLS - 1] = 2
    }

    function edge (arr, j, i, dj, di) {
      const wz = cell(state, j, i) !== 0 // returns zero if wall

      const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
      const mj = Math.max(Math.min(j, arr.length - 1), 0)
      const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
      const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

      // returns cell on closest edge of array, based on supplied j and i values
      return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
    }

    function coefficients (xArr, yArr) {
      let iArr = zeros(ROWS, COLS + 1)
      let jArr = zeros(ROWS + 1, COLS)

      for (let j = 0; j < iArr.length; j++) {
        for (let i = 0; i < iArr[j].length; i++) {
          const f = {
            n: values.density * (edge(yArr, j, i - 1, j, i) + edge(yArr, j, i, j, i - 1)),
            s: values.density * (edge(yArr, j + 1, i - 1, j + 1, i) + edge(yArr, j + 1, i, j + 1, i - 1)),
            w: values.density * (edge(xArr, j, i - 1, j, i) + edge(xArr, j, i, j, i)),
            e: values.density * (edge(xArr, j, i, j, i) + edge(xArr, j, i + 1, j, i))
          }

          iArr[j][i] = diffuse(f)
        }
      }

      for (let j = 0; j < jArr.length; j++) {
        for (let i = 0; i < jArr[j].length; i++) {
          const f = {
            n: values.density * (edge(yArr, j - 1, i, j, i) + edge(yArr, j, i, j, i)),
            s: values.density * (edge(yArr, j, i, j, i) + edge(yArr, j + 1, i, j, i)),
            w: values.density * (edge(xArr, j - 1, i, j, i) + edge(xArr, j, i, j - 1, i)),
            e: values.density * (edge(xArr, j - 1, i + 1, j, i + 1) + edge(xArr, j, i + 1, j - 1, i + 1))
          }

          jArr[j][i] = diffuse(f)
        }
      }

      return {
        x: iArr,
        y: jArr
      }
    }

    function drag (xArr, yArr) {
      let iArr = zeros(ROWS, COLS + 1)
      let jArr = zeros(ROWS + 1, COLS)

      // performs viscosity calculation in x-axis
      for (let j = 0; j < iArr.length; j++) {
        for (let i = 0; i < iArr[j].length; i++) {
          const plant = slot(plants, cell(state, j, i) - 11)

          const uSub1 = 1 / (1 - plant.phi) // hardcoded to set 11 as first plant state index
          const uSub2 = 2 * ((plant.a0 * params.nu) / ((xArr[j][i] + (xArr[j][i] === 0)) * plant.diameter) + plant.a1)
          const uSub3 = -(1 / 2) * uSub1 * params.rho * uSub2 * plant.density * plant.diameter
          const uSub4 = uSub3 * xArr[j][i] * Math.abs(xArr[j][i])

          iArr[j][i] = uSub4
        }
      }

      // performs viscosity calculation in y-axis
      for (let j = 0; j < jArr.length; j++) {
        for (let i = 0; i < jArr[j].length; i++) {
          const plant = slot(plants, cell(state, j, i) - 11)

          const vSub1 = 1 / (1 - plant.phi) // hardcoded to set 11 as first plant state index
          const vSub2 = 2 * ((plant.a0 * params.nu) / ((yArr[j][i] + (yArr[j][i] === 0)) * plant.diameter) + plant.a1)
          const vSub3 = -(1 / 2) * vSub1 * params.rho * vSub2 * plant.density * plant.diameter
          const vSub4 = vSub3 * yArr[j][i] * Math.abs(yArr[j][i])

          jArr[j][i] = vSub4
        }
      }

      return {
        x: iArr,
        y: jArr
      }
    }

    function couple (pArr, xArr, yArr, aX, aY) {
      let iArr = zeros(ROWS, COLS + 1)
      let jArr = zeros(ROWS + 1, COLS)

      let {
        x: iVis,
        y: jVis
      } = viscosity(xArr, yArr)

      let {
        x: iForce,
        y: jForce
      } = drag(xArr, yArr)

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
                      cell(state, j, i - 1) !== 0 &&
                      cell(state, j - 1, i) !== 0 &&
                      cell(state, j + 1, i) !== 0 &&
                      cell(state, j - 1, i - 1) !== 0 &&
                      cell(state, j + 1, i - 1) !== 0)

          // returns true if inlet cell adjacent to wall in x-axis
          const inL = cell(state, j, i - 1) === 0 && cell(state, j, i) === 1
          const inR = cell(state, j, i) === 0 && cell(state, j, i - 1) === 1

          const uSub1 = vx.n + vx.s + vx.w + vx.e
          const uSub2 = cell(pArr, j, i - 1) - cell(pArr, j, i)
          const uSub3 = (uSub1 + (uSub2 * params.size)/* + iVis[j][i] + iForce[j][i]*/) * wx

          iArr[j][i] = (uSub3 * !(inL || inR)) / aX[j][i].c + (inL ^ inR) * params.input.x // either returns calculated value or inlet value
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
                      cell(state, j - 1, i) !== 0 &&
                      cell(state, j, i - 1) !== 0 &&
                      cell(state, j, i + 1) !== 0 &&
                      cell(state, j - 1, i - 1) !== 0 &&
                      cell(state, j - 1, i + 1) !== 0)

          // returns true if inlet cell adjacent to wall in y-axis
          const inU = cell(state, j - 1, i) === 0 && cell(state, j, i) === 1
          const inD = cell(state, j, i) === 0 && cell(state, j - 1, i) === 1

          const vSub1 = vy.n + vy.s + vy.w + vy.e
          const vSub2 = cell(pArr, j - 1, i) - cell(pArr, j, i)
          const vSub3 = (vSub1 + (vSub2 * params.size)/* + jVis[j][i] + jForce[j][i]*/) * wy

          jArr[j][i] = (vSub3 * !(inU || inD)) / aY[j][i].c + (inU ^ inD) * params.input.y // either returns calculated value or inlet value
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
          let vx = {
            w: cell(xArr, j, i),
            e: cell(xArr, j, i + 1)
          }

          let vy = {
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
          let pSub3 = 1 / a.n + 1 / a.s + 1 / a.w + 1 / a.e

          kArr[j][i] = (pSub1 + pSub2) / pSub3 * (cell(state, j, i) !== 0)

          // if (j === 0 && i === 2) console.log('top:', yA[j][i], yA[j + 1][i], xA[j][i], xA[j][i + 1], '\n')
          // if (j === ROWS - 1 && i === 2) console.log('bot:', yA[j][i], yA[j + 1][i], xA[j][i], xA[j][i + 1], '\n')

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
          kArr[j][i] = pArr[j][i] + qArr[j][i] / 10000
        }
      }

      // performs velocity calculation in x-axis
      for (let j = 0; j < iArr.length; j++) {
        for (let i = 0; i < iArr[j].length; i++) {
          const wx = (cell(state, j, i - 1) === 0 && cell(state, j, i) === 2) ||
                     (cell(state, j, i - 1) === 2 && cell(state, j, i) === 0) ||
                     (cell(state, j, i) !== 0 &&
                      cell(state, j - 1, i) !== 0 &&
                      cell(state, j + 1, i) !== 0 &&
                      cell(state, j, i - 1) !== 0 &&
                      cell(state, j - 1, i - 1) !== 0 &&
                      cell(state, j + 1, i - 1) !== 0)

          // returns true if inlet cell adjacent to wall in x-axis
          const inL = cell(state, j, i - 1) === 0 && cell(state, j, i) === 1
          const inR = cell(state, j, i - 1) === 1 && cell(state, j, i) === 0

          const outX = cell(xArr, j, i) + (cell(qArr, j, i - 1) - cell(qArr, j, i)) * (params.size / xA[j][i].c)

          iArr[j][i] = wx * outX * !(inL || inR) + (inL ^ inR) * params.input.x // either returns calculated value or inlet value
        }
      }

      // performs velocity calculation in y-axis
      for (let j = 0; j < jArr.length; j++) {
        for (let i = 0; i < jArr[j].length; i++) {
          // returns true if inlet cell adjacent to wall in y-axis

          const wy = (cell(state, j - 1, i) === 0 && cell(state, j, i) === 2) ||
                     (cell(state, j - 1, i) === 2 && cell(state, j, i) === 0) ||
                     (cell(state, j, i) !== 0 &&
                      cell(state, j, i - 1) !== 0 &&
                      cell(state, j, i + 1) !== 0 &&
                      cell(state, j - 1, i) !== 0 &&
                      cell(state, j - 1, i - 1) !== 0 &&
                      cell(state, j - 1, i + 1) !== 0)

          const inU = cell(state, j - 1, i) === 0 && cell(state, j, i) === 1
          const inD = cell(state, j - 1, i) === 1 && cell(state, j, i) === 0

          const outY = cell(yArr, j, i) + (cell(qArr, j - 1, i) - cell(qArr, j, i)) * (params.size / yA[j][i].c)

          jArr[j][i] = wy * outY * !(inU || inD) + (inU ^ inD) * params.input.y // either returns calculated value or inlet value
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
          const val = 120 - pArr[y][x] / maxp * 120

          ctxp.fillStyle = `hsl(${val}, 100%, ${50 *
            (cell(state, y, x) !== 0)}%)`
          ctxp.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }

      for (let i = 0; i < xArr.length; i++) {
        for (let j = 0; j < xArr[i].length; j++) {
          const vel = xArr[i][j]

          ctxx.fillStyle = `hsl(${Math.floor(
            240 - vel / maxv * 240
          )}, 100%, 50%)`
          ctxx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }

      for (let i = 0; i < yArr.length; i++) {
        for (let j = 0; j < yArr[i].length; j++) {
          const vel = yArr[i][j]

          ctxy.fillStyle = `hsl(${Math.floor(
            240 - vel / maxv * 240
          )}, 100%, 50%)`
          ctxy.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }

      document.querySelector('.xscale .min').textContent = '0'
      document.querySelector('.xscale .max').textContent = maxv.toFixed(5)

      document.querySelector('.yscale .min').textContent = '0'
      document.querySelector('.yscale .max').textContent = maxv.toFixed(5)

      document.querySelector('.pscale .min').textContent = -maxp.toFixed(5)
      document.querySelector('.pscale .max').textContent = maxp.toFixed(5)
    }

    for (let i = 0; i < ctxpscale.canvas.width; i++) {
      ctxpscale.fillStyle = `hsl(${Math.floor(
        240 - i / ctxpscale.canvas.width * 240
      )}, 100%, 50%)`
      ctxpscale.fillRect(i, 0, 10, 50)
    }

    for (let i = 0; i < ctxxscale.canvas.width; i++) {
      ctxxscale.fillStyle = `hsl(${Math.floor(
        240 - i / ctxxscale.canvas.width * 240
      )}, 100%, 50%)`
      ctxxscale.fillRect(i, 0, 10, 50)
    }

    for (let i = 0; i < ctxyscale.canvas.width; i++) {
      ctxyscale.fillStyle = `hsl(${Math.floor(
        240 - i / ctxyscale.canvas.width * 240
      )}, 100%, 50%)`
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

        draw(prevP, nextX, nextY)

        // invokes next animation frame if convergence is above threshold
        if (converge(nextX, nextY, prevX, prevY) > 0.0000000001) {
          prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
          prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
          prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out

          requestAnimationFrame(execute)
        } else {
          for (let j = 0; j < nextX.length; j++) {
            console.log(nextX[j][COLS - 1])
          }

          console.log(nextP[9][0])

          // let test = []
          //
          // for (let i = 0; i < nextX[0].length; i++) {
          //   test[i] = 0
          // }
          //
          // for (let j = 0; j < nextX.length; j++) {
          //   for (let i = 0; i < nextX[j].length; i++) {
          //     test[i] += nextX[j][i]
          //   }
          // }
          //
          // for (let i = 0; i < nextX[0].length; i++) {
          //   console.log(test[i])
          // }
        }
      }
    }
    // setInterval(execute, 1000)
    requestAnimationFrame(execute)
  },
  false
)
