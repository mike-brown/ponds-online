'use strict'

const cols = 27
const rows = 9

let state = zeros(cols, rows)

state[0][4] = 1

let prevP = zeros(cols, rows) // I,J
let prevX = zeros(cols + 1, rows + 1) // i,J
let prevY = zeros(cols + 1, rows + 1) // I,j

let tempP
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
  for (let j = 0; j < cols; j++) {
    let line = []
    for (let i = 0; i < rows; i++) {
      line.push(0)
    }
    grid.push(line)
  }
  return grid
}

function couple (cArr, pArr, xArr, yArr) {
  let jArr = zeros(yArr.length, yArr[0].length)
  let iArr = zeros(xArr.length, xArr[0].length)

  for (let j = 0; j < xArr.length; j++) {
    for (let i = 0; i < xArr[j].length; i++) {
      const dir = {
        n: bounds(j - 1, i, xArr),
        s: bounds(j + 1, i, xArr),
        w: bounds(j, i - 1, xArr),
        e: bounds(j, i + 1, xArr)
      }

      if ((dir.n && dir.s && dir.w && dir.e) || cArr[j][i] !== 0) {
        const vx = {
          n: dir.n ? xArr[j - 1][i] : cArr[j][i] === 1 ? 0.00005 : cArr[j][i] === 2 ? xArr[j][i] : 0,
          s: dir.s ? xArr[j + 1][i] : cArr[j][i] === 1 ? -0.00005 : cArr[j][i] === 2 ? xArr[j][i] : 0,
          w: dir.w ? xArr[j][i - 1] : cArr[j][i] === 1 ? 0.00005 : cArr[j][i] === 2 ? xArr[j][i] : 0,
          e: dir.e ? xArr[j][i + 1] : cArr[j][i] === 1 ? -0.00005 : cArr[j][i] === 2 ? xArr[j][i] : 0
        }

        const vy = {
          n: dir.n ? yArr[j - 1][i] : cArr[j][i] === 1 ? 0.00005 : cArr[j][i] === 2 ? yArr[j][i] : 0,
          s: dir.s ? yArr[j + 1][i] : cArr[j][i] === 1 ? -0.00005 : cArr[j][i] === 2 ? yArr[j][i] : 0,
          w: dir.w ? yArr[j][i - 1] : cArr[j][i] === 1 ? 0.00005 : cArr[j][i] === 2 ? yArr[j][i] : 0,
          e: dir.e ? yArr[j][i + 1] : cArr[j][i] === 1 ? -0.00005 : cArr[j][i] === 2 ? yArr[j][i] : 0
        }

        const p = {
          n: dir.n ? pArr[j - 1][i] : cArr[j][i] === 1 ? pArr[j][i] : 0,
          w: dir.w ? pArr[j][i - 1] : cArr[j][i] === 1 ? pArr[j][i] : 0
        }

        let ox = vx.n + vx.s + vx.w + vx.e + (p.w - pArr[j][i]) * params.size // + divergence
        let oy = vy.n + vy.s + vy.w + vy.e + (p.n - pArr[j][i]) * params.size // + divergence

        jArr[j][i] = oy
        iArr[j][i] = ox
      } else {
        jArr[j][i] = 0
        iArr[j][i] = 0
      }
    }
  }
  return {
    y: jArr,
    x: iArr
  }
}

function bounds (j, i, arr) {
  return j >= 0 && i >= 0 && j < arr.length && i < arr[j].length
}

function execute () {
  console.log(couple(state, prevP, prevX, prevY))

  let temp = couple(state, prevP, prevX, prevY)
}

window.addEventListener('DOMContentLoaded', function () {
  setInterval(execute, 20)
}, false)
