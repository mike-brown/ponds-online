'use strict'

const {
  zeros,
  cell,
  // edge,
  // slot,
  // diffuse,
  coefficients,
  // viscosity,
  // drag,
  couple,
  jacobi,
  correct,
  converge
} = require('./fluid')

const {
  CELL_SIZE,
  COLS,
  ROWS,
  params
  // values,
  // plants
} = require('./config')

window.addEventListener(
  'DOMContentLoaded',
  function () {
    const running = document.querySelector('.js-running')
    const ctxp = document.querySelector('.canvasp').getContext('2d') // pressure canvas
    const ctxx = document.querySelector('.canvasx').getContext('2d') // x-velocity canvas
    const ctxy = document.querySelector('.canvasy').getContext('2d') // y-velocity canvas
    const ctxpscale = document.querySelector('.canvaspscale').getContext('2d')
    const ctxxscale = document.querySelector('.canvasxscale').getContext('2d')
    const ctxyscale = document.querySelector('.canvasyscale').getContext('2d')

    ctxp.canvas.width = COLS * CELL_SIZE + 1
    ctxp.canvas.height = ROWS * CELL_SIZE + 1
    ctxx.canvas.width = (COLS + 1) * CELL_SIZE + 1
    ctxx.canvas.height = ROWS * CELL_SIZE + 1
    ctxy.canvas.width = COLS * CELL_SIZE + 1
    ctxy.canvas.height = (ROWS + 1) * CELL_SIZE + 1

    const tolerance = Math.sqrt(Math.pow(params.input.x, 2) + Math.pow(params.input.y, 2)) / 1000000

    // defines states of current cells: 0 = wall, 1 = inlet, 2 = outlet, 10+ = vegetation types
    let state = zeros(ROWS, COLS)

    let prevP = zeros(ROWS, COLS) //     ( 9R, 27C)
    let prevX = zeros(ROWS, COLS + 1) // ( 9R, 28C)
    let prevY = zeros(ROWS + 1, COLS) // (10R, 27C)

    let primeP = zeros(ROWS, COLS)

    let tempX, tempY, valsX, valsY, nextP, nextX, nextY

    for (let j = 0; j < state.length - 0; j++) {
      for (let i = 0; i < state[j].length - 0; i++) {
        state[j][i] = 10 // sets all inner cells to water cells
      }
    }

    // for (let j = 8; j < state.length - 8; j++) {
    //   for (let i = 25; i < state[j].length - 25; i++) {
    //     state[j][i] = 11
    //   }
    // }

    // for (let j = 0; j < prevX.length - 0; j++) {
    //   for (let i = 0; i < prevX[j].length - 0; i++) {
    //     prevX[j][i] = params.input.x
    //   }
    // }

    for (let j = 1; j < ROWS - 1; j++) {
      state[j][0] = 1 // sets leftmost column to inlets
      prevX[j][0] = params.input.x

      state[ROWS - 1 - j][COLS - 1] = 2 // sets rightmost column to outlets
    }

    // for (let i = 1; i < COLS - 1; i++) {
    //   state[0][i] = 1 // sets leftmost column to inlets
    //   prevY[0][i] = params.input.y
    //   state[ROWS - 1][COLS - 1 - i] = 2 // sets rightmost column to outlets
    // }

    function draw (sArr, pArr, xArr, yArr) {
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
          const val = 240 - pArr[y][x] / maxp * 240

          ctxp.fillStyle = `hsl(${val}, 100%, ${25 *
            (cell(sArr, y, x) !== 0) + 25}%)`
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

      document.querySelector('.pscale .min').textContent = '0'// -maxp.toFixed(5)
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
        let temp = coefficients(state, prevX, prevY)

        valsX = temp.x
        valsY = temp.y

        temp = couple(state, prevP, prevX, prevY, valsX, valsY)

        tempX = temp.x
        tempY = temp.y

        primeP = jacobi(state, primeP, tempX, tempY, valsX, valsY)

        temp = correct(state, prevP, primeP, tempX, tempY, valsX, valsY)

        nextP = temp.p
        nextX = temp.x
        nextY = temp.y

        draw(state, nextP, tempX, nextY)

        // invokes next animation frame if convergence is above threshold
        if (converge(state, nextX, nextY, prevX, prevY) > tolerance) {
          // console.log('x1:', (nextX[9][1] * 1000).toFixed(3), 'x2:', (nextX[9][2] * 1000).toFixed(3))

          prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
          prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
          prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out
        } else {
          for (let j = 0; j < nextX.length; j++) {
            console.log(nextX[j][COLS - 1])
            running.checked = false
          }

          // console.log('i:', nextP[9][0])
          // console.log('o:', nextP[9][COLS - 1])

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
          //   (test[i])
          // }

          // let test = []
          //
          // for (let i = 0; i < prevP[0].length; i++) {
          //   test[i] = prevP[9][i]
          // }
          //
          // for (let j = 0; j < prevP.length; j++) {
          //   for (let i = 0; i < prevP[j].length; i++) {
          //     test[i] += nextX[j][i]
          //   }
          // }
          //
          // for (let i = 0; i < prevP[0].length; i++) {
          //   console.log(test[i])
          // }
        }
      }

      // console.log('xL:' + nextX[9][2] + '\nxL:' + nextX[ROWS - 9][1])
      // console.log('yL:' + nextY[1][1] + '\nyL:' + nextY[ROWS - 1][1])
      //
      // console.log('xR:' + nextX[1][COLS - 2] + '\nxR:' + nextX[ROWS - 2][COLS - 1])
      // console.log('yR:' + nextY[1][COLS - 2] + '\nyR:' + nextY[ROWS - 1][COLS - 2])

      requestAnimationFrame(execute)
    }
    // setInterval(execute, 2000)
    // requestAnimationFrame(execute)
    requestAnimationFrame(execute)
  },
  false
)
