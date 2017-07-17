'use strict'

const {
  zeros,
  ax,
  ay,
  couple,
  jacobi,
  correct,
  converge
} = require('./fluid') // imports simulation functions from fluid.js file

const {
  dye,
  concentrations,
  corrections,
  record
} = require('./flow') // imports simulation functions from flow.js file

const {
  CELL_SIZE,
  COLS,
  ROWS,
  params,
  values
} = require('./config') // imports simulation properties from config.js file

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

    const tolerance = Math.sqrt(
      Math.pow(params.input.x, 2) +
      Math.pow(params.input.y, 2)
    ) / 100000 // defines convergence threshold for simulation

    let converged = false

    let count = 0

    // defines states of current cells: 0 = wall, 1 = inlet, 2 = outlet, 11+ = vegetation
    let state = zeros(ROWS, COLS)

    let prevP = zeros(ROWS, COLS) //     (20R, 80C)
    let prevX = zeros(ROWS, COLS + 1) // (20R, 81C)
    let prevY = zeros(ROWS + 1, COLS) // (21R, 80C)

    let primeP = zeros(ROWS, COLS) //    (20R, 80C)
    let aX = zeros(ROWS, COLS + 1)
    let aY = zeros(ROWS + 1, COLS)

    for (let j = 0; j < state.length; j++) {
      for (let i = 0; i < state[j].length; i++) {
        state[j][i] = 10// + (j > 9 && i > 9) * 2 // sets all inner cells to water cells
        // state[parseInt(j / 2)][40] = 0
      }
    }

    // for (let j = 0; j < prevX.length - 0; j++) {
    //   for (let i = 0; i < prevX[j].length - 0; i++) {
    //     prevX[j][i] = params.input.x
    //   }
    // }

    for (let j = 1; j < ROWS - 1; j++) {
      state[j][0] = 1 // sets leftmost column to inlets

      state[j][COLS - 1] = 2 // sets rightmost column to outlets
      // state[j][COLS - 1] = 0 // sets rightmost column to wall
    }

    // for (let i = 1; i < COLS - 1; i++) {
    //   state[0][i] = 1 // sets leftmost column to inlets
    //
    //   state[ROWS - 2][i] = 2 // sets lowest row to outlets
    //   state[ROWS - 1][i] = 0 // sets lowest row to outlets
    // }

    let prevC = dye(state)

    function draw (sArr, pArr, xArr, yArr) {
      ctxp.clearRect(0, 0, ctxp.canvas.width, ctxp.canvas.height) // clears the pressure canvas
      ctxx.clearRect(0, 0, ctxx.canvas.width, ctxx.canvas.height) // clears the x-velocity canvas
      ctxy.clearRect(0, 0, ctxy.canvas.width, ctxy.canvas.height) // clears the y-velocity canvas

      let maxp = 0 // defines maximum pressure value
      let maxv = 0 // defines maximum velocity value

      for (let y = 0; y < pArr.length; y++) {
        for (let x = 0; x < pArr[y].length; x++) {
          maxp = Math.max(maxp, Math.abs(pArr[y][x])) // updates if new pressure is higher than highest known pressure
        }
      }

      for (let y = 0; y < xArr.length; y++) {
        for (let x = 0; x < xArr[y].length; x++) {
          maxv = Math.max(maxv, Math.abs(xArr[y][x])) // updates if new velocity is higher than highest known velocity
        }
      }

      for (let y = 0; y < yArr.length; y++) {
        for (let x = 0; x < yArr[y].length; x++) {
          maxv = Math.max(maxv, Math.abs(yArr[y][x])) // updates if new velocity is higher than highest known velocity
        }
      }

      for (let y = 0; y < pArr.length; y++) {
        for (let x = 0; x < pArr[y].length; x++) {
          const val = 240 - pArr[y][x] / maxp * 240 // scales maximum pressure between 0 and 240

          ctxp.fillStyle = `hsl(${val}, 100%, ${25 * (sArr[y][x] !== 0) + 25}%)` // srts colour based on pressure value; with halved brightness for walls
          ctxp.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }

      for (let i = 0; i < xArr.length; i++) {
        for (let j = 0; j < xArr[i].length; j++) {
          const val = 240 - xArr[i][j] / maxv * 240 // scales maximum velocity between 0 and 240

          ctxx.fillStyle = `hsl(${val}, 100%, 50%)` // sets colour based on velocity value
          ctxx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }

      for (let i = 0; i < yArr.length; i++) {
        for (let j = 0; j < yArr[i].length; j++) {
          const val = 240 - yArr[i][j] / maxv * 240 // scales maximum velocity between 0 and 240

          ctxy.fillStyle = `hsl(${val}, 100%, 50%)` // sets colour based on velocity value
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

    function initiate () {
      if (running.checked) {
        const valsX = ax(
          state, prevX, prevY,
          values.density,
          values.diffuse
        ) // calculates a-values for the x-velocity axis

        const valsY = ay(
          state, prevX, prevY,
          values.density,
          values.diffuse
        ) // calculates a-values for the y-velocity axis

        const [
          tempX,
          tempY
        ] = couple(
          state, prevP, prevX, prevY, valsX, valsY,
          params.size,
          params.mu,
          params.nu,
          params.rho,
          params.input.x,
          params.input.y
        ) // calcualtes pressure-velocity coupling terms

        primeP = jacobi(state, primeP, tempX, tempY, valsX, valsY,
          params.size
        ) // calculates pressure estimate

        const [
          nextX,
          nextY,
          nextP
        ] = correct(state, prevP, primeP, tempX, tempY, prevX, prevY, valsX, valsY,
          params.size,
          params.input.x,
          params.input.y
        ) // calculates corrected values

        if (count === 0) {
          draw(state, nextP, nextX, nextY)
          count = 1
        }

        // invokes next animation frame if convergence is above threshold
        if (converge(state, nextX, nextY, prevX, prevY) > tolerance) {
          count--
          prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
          prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
          prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out
        } else {
          // running.checked = false // disables simulation loop
          converged = true
          prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
          prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
          prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out
          aX = valsX.map(arr => [...arr]) // puts array into cell and expands out
          aY = valsY.map(arr => [...arr]) // puts array into cell and expands out

          console.log('converged!')

          // for (let j = 0; j < nextX.length; j++) {
          //   console.log(nextX[j][COLS - 1])
          // }

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
          //
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

          draw(state, nextP, nextX, nextY)
        }
      }

      if (!converged) {
        requestAnimationFrame(initiate)
      } else {
        setInterval(simulate, 1000)
        // requestAnimationFrame(simulate)
      }
    }

    function simulate () {
      if (running.checked) {
        let tempC = concentrations(state, prevC, 0.0001)

        // let tempC = jacobi(state, prevC, prevX, prevY, aX, aY,
        //   params.size
        // ) // calculates pressure estimate

        let tempD = corrections(state, prevX, prevY, tempC)
        draw(state, tempD, prevX, prevY)

        // console.log(tempC, tempD)
        if (true) {
          prevC = tempD.map(arr => [...arr]) // puts array into cell and expands out
        }
      }

      // requestAnimationFrame(simulate)
    }
    // setInterval(initiate, 400)
    requestAnimationFrame(initiate)
  },
  false
)
