'use strict'

const {
  // CELL_SIZE,
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

function pyth (a, b) {
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
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

function edge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i) !== 0 // returns zero if wall
  const wdz = (cell(sArr, dj, di) !== 0) // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz * wdz
}

function eastedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i - 1) !== 0 // returns zero if wall
  const wdz = (cell(sArr, dj, di - 1) !== 0) // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz * wdz
}

function downedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j - 1, i) !== 0 // returns zero if wall
  const wdz = (cell(sArr, dj - 1, di) !== 0) // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz * wdz
}

function softedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
}

function softeastedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i - 1) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
}

function softdownedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j - 1, i) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
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
    c: a.n + a.s + a.w + a.e + (f.e - f.w) + (f.n - f.s) // a_c = a_n + a_s + a_w + a_e + d_F
  }
}

function coefficients (sArr, xArr, yArr) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const f = {
        n: values.density * (edge(sArr, yArr, j, i - 1, j, i) +
                             edge(sArr, yArr, j, i, j, i - 1)),
        s: values.density * (downedge(sArr, yArr, j + 1, i - 1, j + 1, i) +
                             downedge(sArr, yArr, j + 1, i, j + 1, i - 1)),
        w: values.density * (edge(sArr, xArr, j, i - 1, j, i) +
                             edge(sArr, xArr, j, i, j, i - 1)),
        e: values.density * (eastedge(sArr, xArr, j, i, j, i + 1) +
                             eastedge(sArr, xArr, j, i + 1, j, i))
      }

      iArr[j][i] = diffuse(f)
    }
  }

  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const f = {
        n: values.density * (edge(sArr, yArr, j - 1, i, j, i) +
                             edge(sArr, yArr, j, i, j - 1, i)),
        s: values.density * (downedge(sArr, yArr, j, i, j + 1, i) +
                             downedge(sArr, yArr, j + 1, i, j, i)),
        w: values.density * (edge(sArr, xArr, j - 1, i, j, i) +
                             edge(sArr, xArr, j, i, j - 1, i)),
        e: values.density * (eastedge(sArr, xArr, j - 1, i + 1, j, i + 1) +
                             eastedge(sArr, xArr, j, i + 1, j - 1, i + 1))
      }

      jArr[j][i] = diffuse(f)
    }
  }

  return {
    x: iArr,
    y: jArr
  }
}

function viscosity (xArr, yArr) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  const denom = 2 * params.size

  // performs viscosity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const uSub1 = cell(xArr, j, i + 1) // takes cell to the east
      const uSub2 = 2 * xArr[j][i] // takes center cell
      const uSub3 = cell(xArr, j, i - 1) // takes cell to the west

      iArr[j][i] = (params.mu * (uSub1 - uSub2 + uSub3)) / denom
    }
  }

  // performs viscosity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const vSub1 = cell(yArr, j + 1, i) // takes cell to the south
      const vSub2 = 2 * yArr[j][i] // takes center cell
      const vSub3 = cell(yArr, j - 1, i) // takes cell to the north

      jArr[j][i] = (params.mu * (vSub1 - vSub2 + vSub3)) / denom
    }
  }

  return {
    x: iArr,
    y: jArr
  }
}

function drag (sArr, xArr, yArr) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  // performs viscosity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const p = plants.find(pt => pt.state === cell(sArr, j, i)) || plants[0]

      const c = {
        a: (p.a0 * params.nu),
        b: (4 * p.phi) / (p.diameter * Math.PI)
      }

      const reynold = pyth(
        cell(xArr, j, i) + cell(xArr, j, i + 1),
        cell(yArr, j, i) + cell(yArr, j + 1, i)
      )

      const uSub1 = 1 / (1 - p.phi) // hardcoded to set 11 as first plant state index
      const uSub2 = c.a / ((reynold + (reynold === 0)) * p.diameter) + p.a1
      const uSub3 = -(uSub1 * params.rho * Math.min(10, 2 * uSub2) * c.b) / 2

      iArr[j][i] = uSub3 * xArr[j][i] * Math.abs(xArr[j][i])
    }
  }

  // performs viscosity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const p = plants.find(pt => pt.state === cell(sArr, j, i)) || plants[0]

      const c = {
        a: (p.a0 * params.nu),
        b: (4 * p.phi) / (p.diameter * Math.PI)
      }

      const reynold = pyth(
        cell(xArr, j, i) + cell(xArr, j, i + 1),
        cell(yArr, j, i) + cell(yArr, j + 1, i)
      )

      const vSub1 = 1 / (1 - p.phi) // hardcoded to set 11 as first plant state index
      const vSub2 = c.a / ((reynold + (reynold === 0)) * p.diameter) + p.a1
      const vSub3 = -(vSub1 * params.rho * Math.min(10, 2 * vSub2) * c.b) / 2

      jArr[j][i] = vSub3 * yArr[j][i] * Math.abs(yArr[j][i])
    }
  }

  return {
    x: iArr,
    y: jArr
  }
} function couple (sArr, pArr, xArr, yArr, aX, aY) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  let {
    x: iVis,
    y: jVis
  } = viscosity(xArr, yArr)

  let {
    x: iForce,
    y: jForce
  } = drag(sArr, xArr, yArr)

  // performs velocity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const vx = {
        n: aX[j][i].n * softedge(sArr, xArr, j - 1, i, j, i),
        s: aX[j][i].s * softedge(sArr, xArr, j + 1, i, j, i),
        w: aX[j][i].w * softedge(sArr, xArr, j, i - 1, j, i),
        e: aX[j][i].e * softeastedge(sArr, xArr, j, i + 1, j, i)
      }

      const wx = (cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j, i - 1) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j, i - 1) !== 0 &&
                  (cell(sArr, j + 1, i) !== 0 ||
                  cell(sArr, j + 1, i - 1) !== 0) &&
                  (cell(sArr, j - 1, i) !== 0 ||
                  cell(sArr, j - 1, i - 1) !== 0))

      // returns true if inlet cell adjacent to wall in x-axis
      const inL = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 1
      const inR = cell(sArr, j, i) === 0 && cell(sArr, j, i - 1) === 1

      const uSub1 = vx.n + vx.s + vx.w + vx.e
      const uSub2 = cell(pArr, j, i - 1) - cell(pArr, j, i)
      const uSub3 = (uSub1 + (uSub2 * params.size) + iVis[j][i] + iForce[j][i]) * wx

      iArr[j][i] = (uSub3 * !(inL || inR)) / aX[j][i].c + (inL ^ inR) * params.input.x // either returns calculated value or inlet value
    }
  }

  // performs velocity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const vy = {
        n: aY[j][i].n * softedge(sArr, yArr, j - 1, i, j, i),
        s: aY[j][i].s * softdownedge(sArr, yArr, j + 1, i, j, i),
        w: aY[j][i].w * softedge(sArr, yArr, j, i - 1, j, i),
        e: aY[j][i].e * softedge(sArr, yArr, j, i + 1, j, i)
      }

      const wy = (cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j - 1, i) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j - 1, i) !== 0 &&
                 (cell(sArr, j, i - 1) !== 0 ||
                  cell(sArr, j - 1, i - 1) !== 0) &&
                 (cell(sArr, j, i + 1) !== 0 ||
                  cell(sArr, j - 1, i + 1) !== 0))

      // returns true if inlet cell adjacent to wall in y-axis
      const inU = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 1
      const inD = cell(sArr, j, i) === 0 && cell(sArr, j - 1, i) === 1

      const vSub1 = vy.n + vy.s + vy.w + vy.e
      const vSub2 = cell(pArr, j - 1, i) - cell(pArr, j, i)
      const vSub3 = (vSub1 + (vSub2 * params.size) + jVis[j][i] + jForce[j][i]) * wy

      jArr[j][i] = (vSub3 * !(inU || inD)) / aY[j][i].c + (inU ^ inD) * params.input.y // either returns calculated value or inlet value
    }
  }

  return {
    x: iArr,
    y: jArr
  }
}

function jacobi (sArr, pArr, xArr, yArr, xA, yA) {
  const kArr = zeros(ROWS, COLS)

  for (let j = 0; j < kArr.length; j++) {
    for (let i = 0; i < kArr[j].length; i++) {
      let vx = {
        w: xArr[j][i],
        e: xArr[j][i + 1]
      }

      let vy = {
        n: yArr[j][i],
        s: yArr[j + 1][i]
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

      kArr[j][i] = (pSub1 + pSub2) / pSub3 * (cell(sArr, j, i) !== 0) // this calculation does not apply correct division formula

      // kArr[j][i] = p.n + p.s + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
    }
  }

  return kArr
}

function correct (sArr, pArr, qArr, xArr, yArr, xOld, yOld, xA, yA) {
  const iArr = zeros(ROWS, COLS + 1)
  const jArr = zeros(ROWS + 1, COLS)
  const kArr = zeros(ROWS, COLS)

  // performs velocity calculation in x-axis
  for (let j = 0; j < kArr.length; j++) {
    for (let i = 0; i < kArr[j].length; i++) {
      kArr[j][i] = pArr[j][i] + qArr[j][i] * 0.01 // hardcoded under-relaxation factor
    }
  }

  // performs velocity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const wx = (cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j, i - 1) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j, i - 1) !== 0 &&
                 (cell(sArr, j + 1, i) !== 0 ||
                  cell(sArr, j + 1, i - 1) !== 0) &&
                 (cell(sArr, j - 1, i) !== 0 ||
                  cell(sArr, j - 1, i - 1) !== 0))

      // returns true if inlet cell adjacent to wall in x-axis
      const inL = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 1
      const inR = cell(sArr, j, i - 1) === 1 && cell(sArr, j, i) === 0

      const outX = xArr[j][i] + (cell(qArr, j, i - 1) - cell(qArr, j, i)) * (params.size / xA[j][i].c)

      const relX = 0.2 * outX + (1 - 0.2) * xOld[j][i]

      iArr[j][i] = wx * relX * !(inL || inR) + (inL ^ inR) * params.input.x // either returns calculated value or inlet value
    }
  }

  // performs velocity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const wy = (cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j - 1, i) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j - 1, i) !== 0 &&
                 (cell(sArr, j, i - 1) !== 0 ||
                  cell(sArr, j - 1, i - 1) !== 0) &&
                 (cell(sArr, j, i + 1) !== 0 ||
                  cell(sArr, j - 1, i + 1) !== 0))

      // returns true if inlet cell adjacent to wall in y-axis
      const inU = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 1
      const inD = cell(sArr, j - 1, i) === 1 && cell(sArr, j, i) === 0

      const outY = yArr[j][i] + (cell(qArr, j - 1, i) - cell(qArr, j, i)) * (params.size / yA[j][i].c)

      const relY = 0.2 * outY + (1 - 0.2) * yOld[j][i]

      jArr[j][i] = wy * relY * !(inU || inD) + (inU ^ inD) * params.input.y // either returns calculated value or inlet value
    }
  }

  return {
    x: iArr,
    y: jArr,
    p: kArr
  }
}

function converge (sArr, xArr, yArr, iArr, jArr) {
  let temp = 0
  let diff = 0
  let step = 0

  for (let j = 0; j < sArr.length; j++) {
    for (let i = 0; i < sArr[j].length; i++) {
      step += sArr[j][i] !== 0 // increments if cell isn't a wall
    }
  }

  for (let j = 0; j < ROWS + 1; j++) {
    for (let i = 0; i < COLS + 1; i++) {
      temp = Math.pow(cell(xArr, j, i) - cell(iArr, j, i), 2)
      temp += Math.pow(cell(yArr, j, i) - cell(jArr, j, i), 2)
      diff += Math.sqrt(temp)
    }
  }

  return diff / step
}

module.exports = {
  zeros,
  pyth,
  coefficients,
  couple,
  jacobi,
  correct,
  converge
}
