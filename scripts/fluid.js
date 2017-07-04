'use strict'

const {
  CELL_SIZE,
  COLS,
  ROWS,
  params,
  values,
  plants
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

function slot (arr, n) {
  const bn = n >= 0 && n < arr.length

  const mn = Math.max(Math.min(n, arr.length - 1), 0)

  // returns zero if cell does not fall within the supplied array range
  return {
    density: arr[mn].density * bn,
    diameter: arr[mn].diameter,
    phi: arr[mn].phi * bn,
    force: arr[mn].force * bn,
    a0: arr[mn].a0 * bn,
    a1: arr[mn].a1 * bn
  }
}

function viscosity (xArr, yArr) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  const denom = 2 * params.size

  // performs viscosity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const uSub1 = cell(iArr, j, i + 1)
      const uSub2 = 2 * xArr[j][i]
      const uSub3 = cell(iArr, j, i - 1)

      iArr[j][i] = (params.mu * (uSub1 - uSub2 + uSub3)) / denom
    }
  }

  // performs viscosity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const vSub1 = cell(jArr, j + 1, i)
      const vSub2 = 2 * yArr[j][i]
      const vSub3 = cell(jArr, j - 1, i)

      jArr[j][i] = (params.mu * (vSub1 - vSub2 + vSub3)) / denom
    }
  }

  return {
    x: iArr,
    y: jArr
  }
}

function diffuse (f) {
  const a = {
    n: values.diffuse + Math.max(f.n, 0), // a_n = D_n + max(F_n, 0)
    s: values.diffuse + Math.max(-f.s, 0), // a_s = D_s + max(-F_s, 0)
    w: values.diffuse + Math.max(f.w, 0), // a_w = D_w + max(F_w, 0)
    e: values.diffuse + Math.max(-f.e, 0) // a_e = D_e + max(-F_e, 0)
  }

  return {
    n: a.n,
    s: a.s,
    w: a.w,
    e: a.e,
    c: a.n + a.s + a.w + a.e + (f.e - f.w) + (f.s - f.n) // a_c = a_n + a_s + a_w + a_e +
  }
}

module.exports = {
  zeros,
  cell,
  slot,
  diffuse,
  viscosity
}
