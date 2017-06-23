'use strict'

const cols = 39
const rows = 19

let state = zeros(rows, cols)

let prevP = zeros(rows, cols) //     ( 9R, 27C)
let prevX = zeros(rows, cols + 1) // ( 9R, 28C)
let prevY = zeros(rows + 1, cols) // (10R, 27C)

state[10][0] = 1
state[10][cols - 1] = 2

prevX[10][0] = 0.00005

let oldP = zeros(rows, cols)
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

function zeros (rows, cols) {
  let grid = []
  for (let j = 0; j < rows; j++) {
    let line = []
    for (let i = 0; i < cols; i++) {
      line.push(0)
    }
    grid.push(line)
  }
  return grid
}

function couple (cArr, pArr, xArr, yArr) {
  let iArr = zeros(rows, cols + 1)
  let jArr = zeros(rows + 1, cols)

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
  for (let j = 0; j < rows; j++) {
    let bool = {
      w: cArr[j][0] === 1,
      e: cArr[j][cols - 1] === 1
    }

    iArr[j][0] += bool.w * 0.00005 // west wall

    iArr[j][cols] -= bool.e * 0.00005 // east wall
  }

  // traverses x-axis and sets y-edge values
  for (let i = 0; i < cols; i++) {
    let bool = {
      n: cArr[0][i] === 1,
      s: cArr[rows - 1][i] === 1
    }

    jArr[0][i] += bool.n * 0.00005 // north wall

    jArr[rows][i] -= bool.s * 0.00005 // south wall
  }

  return {
    x: iArr,
    y: jArr
  }
}

function jacobi (cArr, pArr, xArr, yArr) {
  let kArr = zeros(rows, cols)

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
  for (let j = 1; j < rows - 1; j++) {
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
  for (let j = 1; j < rows - 1; j++) {
    const vx = {
      w: xArr[j][cols - 1],
      e: xArr[j][cols]
    }

    const vy = {
      n: yArr[j][cols - 1],
      s: yArr[j + 1][cols - 1]
    }

    const p = {
      n: pArr[j - 1][cols - 1],
      s: pArr[j + 1][cols - 1],
      w: pArr[j][cols - 2]
    }

    kArr[j][cols - 1] = p.n + p.s + p.w + (vx.w - vx.e + vy.n - vy.s)
  }

  // north bank
  for (let i = 1; i < cols - 1; i++) {
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
  for (let i = 1; i < cols - 1; i++) {
    const vx = {
      w: xArr[rows - 1][i],
      e: xArr[rows - 1][i + 1]
    }

    const vy = {
      n: yArr[rows - 1][i],
      s: yArr[rows][i]
    }

    const p = {
      n: pArr[rows - 2][i],
      w: pArr[rows - 1][i - 1],
      e: pArr[rows - 1][i + 1]
    }

    kArr[rows - 1][i] = p.n + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
  }

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

  {
    const vx = {
      w: xArr[0][cols - 1],
      e: xArr[0][cols]
    }

    const vy = {
      n: yArr[0][cols - 1],
      s: yArr[1][cols - 1]
    }

    const p = {
      s: pArr[1][cols - 1],
      w: pArr[0][cols - 2]
    }

    kArr[0][cols - 1] = p.s + p.w + (vx.w - vx.e + vy.n - vy.s)
  }

  {
    const vx = {
      w: xArr[rows - 1][0],
      e: xArr[rows - 1][1]
    }

    const vy = {
      n: yArr[rows - 1][0],
      s: yArr[rows][0]
    }

    const p = {
      n: pArr[rows - 2][0],
      e: pArr[rows - 1][1]
    }

    kArr[rows - 1][0] = p.n + p.e + (vx.w - vx.e + vy.n - vy.s)
  }

  {
    const vx = {
      w: xArr[rows - 1][cols - 1],
      e: xArr[rows - 1][cols]
    }

    const vy = {
      n: yArr[rows - 1][cols - 1],
      s: yArr[rows][cols - 1]
    }

    const p = {
      n: pArr[rows - 2][cols - 1],
      w: pArr[rows - 1][cols - 2]
    }

    kArr[rows - 1][cols - 1] = p.n + p.w + (vx.w - vx.e + vy.n - vy.s)
  }

  return kArr
}

function correct (cArr, pArr, qArr, xArr, yArr) {
  let iArr = zeros(rows, cols + 1)
  let jArr = zeros(rows + 1, cols)
  let kArr = zeros(rows, cols)

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
  let ctxp = document.getElementById('canvasp').getContext('2d')
  let ctxx = document.getElementById('canvasx').getContext('2d')
  let ctxy = document.getElementById('canvasy').getContext('2d')

  ctxp.clearRect(0, 0, ctxp.canvas.width, ctxp.canvas.height)
  ctxp.rect(0, 0, cols * 10, rows * 10)

  ctxx.clearRect(0, 0, ctxx.canvas.width, ctxx.canvas.height)
  ctxx.rect(0, 0, cols * 10, rows * 10)

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
      ctxp.fillRect(x * 10, y * 10, 10, 10)
    }
  }

  ctxp.stroke()
}

function execute () {
  let temp = couple(state, prevP, prevX, prevY)

  console.log('New Estimated Velocity:', temp)

  tempX = temp.x
  tempY = temp.y

  newP = jacobi(state, oldP, prevX, prevY)

  console.log('New Estimated Pressure:', newP)

  temp = correct(state, prevP, newP, tempX, tempY)

  nextX = temp.x
  nextY = temp.y
  nextP = temp.p

  console.log('New Estimated Component:', temp)

  draw(nextP, nextX, nextY)

  prevX = nextX.map(arr => [...arr]) // puts array into cell and expands out
  prevY = nextY.map(arr => [...arr]) // puts array into cell and expands out
  prevP = nextP.map(arr => [...arr]) // puts array into cell and expands out

  requestAnimationFrame(execute)
}

window.addEventListener('DOMContentLoaded', function () {
  // setInterval(execute, 200)
  requestAnimationFrame(execute)
}, false)
