'use strict'

const cols = 27
const rows = 9

let state = zeros(cols, rows)

state[0][4] = 1

let prevP = zeros(cols, rows) // I,J
let prevX = zeros(cols + 1, rows) // i,J
let prevY = zeros(cols, rows + 1) // I,

prevX[4][4] = 0.00005
prevY[4][4] = 0.00005

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

  for (let j = 0; j < cArr.length; j++) {
    jArr[j][0] += cArr[j][0] * 0.00005 // north wall

    jArr[j][cArr[j].length] -= cArr[j][cArr[j].length - 1] * 0.00005 // south wall
  }

  for (let i = 0; i < cArr[0].length; i++) {
    iArr[0][i] += cArr[0][i] * 0.00005 // west wall

    iArr[cArr.length][i] -= cArr[cArr[i].length - 1][i] * 0.00005 // east wall
  }

  return {
    x: iArr,
    y: jArr
  }
}

function jacobi (cArr, pArr, xArr, yArr) {
  let kArr = zeros(yArr.length, yArr[0].length)
}

function bounds (j, i, arr) {
  return j >= 0 && i >= 0 && j < arr.length && i < arr[j].length
}

function execute () {
  let temp = couple(state, prevP, prevX, prevY)

  console.log(temp)

  tempX = temp.x
  tempY = temp.y
}

window.addEventListener('DOMContentLoaded', function () {
  setInterval(execute, 20)
}, false)
