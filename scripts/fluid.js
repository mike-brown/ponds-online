'use strict'

const {
  CELL_SIZE,
  COLS,
  ROWS,
  params,
  constants
} = require('./config')

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

function cell (arr, j, i) {
  const bx = i >= 0 && i < arr[0].length
  const by = j >= 0 && j < arr.length
  const bz = bx && by

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)

  // returns zero if cell does not fall within the supplied array range
  return arr[mj][mi] * bz
}

function coefcell (arr, j, i) {
  const bx = i >= 0 && i < arr[0].length
  const by = j >= 0 && j < arr.length
  const bz = bx && by

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)

  // returns zero if cell does not fall within the supplied array range
  return {
    n: arr[mj][mi].n * bz,
    s: arr[mj][mi].s * bz,
    w: arr[mj][mi].w * bz,
    e: arr[mj][mi].e * bz,
    c: arr[mj][mi].c * bz
  }
}

function viscosity (xArr, yArr, aX, aY) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  const denom = 4 * params.size

  // performs viscosity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const uSub1 = cell(iArr, j, i + 2)
      const uSub2 = 2 * xArr[j][i]
      const uSub3 = cell(iArr, j, i - 2)

      iArr[j][i] = (params.mu * (uSub1 - uSub2 + uSub3)) / denom
    }
  }

  // performs viscosity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const vSub1 = cell(jArr, j + 2, i)
      const vSub2 = 2 * yArr[j][i]
      const vSub3 = cell(jArr, j - 2, i)

      jArr[j][i] = (params.mu * (vSub1 - vSub2 + vSub3)) / denom
    }
  }

  return {
    x: iArr,
    y: jArr
  }
}

module.exports = {
  zeros,
  cell,
  viscosity
}
