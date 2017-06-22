'use strict'

const cols = 27
const rows = 9

let state = zeros(cols, rows)

state[4][0] = 1

let prevP = zeros(cols, rows) //     (27C,  9R)
let prevX = zeros(cols + 1, rows) // (28C,  9R)
let prevY = zeros(cols, rows + 1) // (27C, 10R)

prevX[6][2] = 0.00005

let oldP = zeros(cols, rows)
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

function zeros (cols, rows) {
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
  let iArr = zeros(cols + 1, rows)
  let jArr = zeros(cols, rows + 1)

  // performs velocity calculation in x-axis
  for (let j = 1; j < iArr.length - 1; j++) {
    for (let i = 1; i < iArr[j].length - 1; i++) {
      const vx = {
        n: xArr[j - 1][i],
        s: xArr[j + 1][i],
        w: xArr[j][i - 1],
        e: xArr[j][i + 1]
      }

      const p = {
        n: pArr[j - 1][i],
        w: pArr[j][i - 1]
      }

      const ox = vx.n + vx.s + vx.w + vx.e + (p.w - pArr[j][i]) * params.size // + divergence

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

      const p = {
        n: pArr[j - 1][i],
        w: pArr[j][i - 1]
      }

      const oy = vy.n + vy.s + vy.w + vy.e + (p.n - pArr[j][i]) * params.size // + divergence

      jArr[j][i] = oy
    }
  }

  for (let j = 0; j < rows; j++) {
    let bool = {
      w: cArr[j][0] === 1,
      e: cArr[j][cols - 1] === 1
    }

    iArr[j][0] += bool.w * 0.00005 // west wall

    iArr[j][cols] -= bool.e * 0.00005 // east wall
  }

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
  let kArr = zeros(cols, rows)

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

function execute () {
  let temp = couple(state, prevP, prevX, prevY)

  console.log('New Estimated Velocity:', temp)

  tempX = temp.x
  tempY = temp.y

  newP = jacobi(state, oldP, prevX, prevY)

  console.log('New Estimated Pressure:', newP)
}

window.addEventListener('DOMContentLoaded', function () {
//  setInterval(execute, 20)
  execute()
}, false)
