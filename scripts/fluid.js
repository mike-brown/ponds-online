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

function coefficients (sArr, xArr, yArr) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const f = {
        n: values.density * (edge(sArr, yArr, j, i - 1, j, i) + edge(sArr, yArr, j, i, j, i - 1)),
        s: values.density * (edge(sArr, yArr, j + 1, i - 1, j + 1, i) + edge(sArr, yArr, j + 1, i, j + 1, i - 1)),
        w: values.density * (edge(sArr, xArr, j, i - 1, j, i) + edge(sArr, xArr, j, i, j, i)),
        e: values.density * (edge(sArr, xArr, j, i, j, i) + edge(sArr, xArr, j, i + 1, j, i))
      }

      const outL = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 2
      const outR = cell(sArr, j, i - 1) === 2 && cell(sArr, j, i) === 0

      iArr[j][i] = diffuse(f)// * !(outL || outR) doesn't work: makes NaN

      // TODO: if outlet, duplicate adjacent a value

      if (j === 9 && i === COLS) console.log(f)
    }
  }

  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const f = {
        n: values.density * (edge(sArr, yArr, j - 1, i, j, i) + edge(sArr, yArr, j, i, j, i)),
        s: values.density * (edge(sArr, yArr, j, i, j, i) + edge(sArr, yArr, j + 1, i, j, i)),
        w: values.density * (edge(sArr, xArr, j - 1, i, j, i) + edge(sArr, xArr, j, i, j - 1, i)),
        e: values.density * (edge(sArr, xArr, j - 1, i + 1, j, i + 1) + edge(sArr, xArr, j, i + 1, j - 1, i + 1))
      }

      // TODO: if outlet, duplicate adjacent a value

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

function drag (sArr, xArr, yArr) {
  let iArr = zeros(ROWS, COLS + 1)
  let jArr = zeros(ROWS + 1, COLS)

  // performs viscosity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const plant = slot(plants, cell(sArr, j, i) - 11)

      const uSub1 = 1 / (1 - plant.phi) // hardcoded to set 11 as first plant state index
      const uSub2 = Math.min(10, 2 * ((plant.a0 * params.nu) / ((xArr[j][i] + (xArr[j][i] === 0)) * plant.diameter) + plant.a1))
      const uSub3 = -(1 / 2) * uSub1 * params.rho * uSub2 * plant.density * plant.diameter
      const uSub4 = uSub3 * xArr[j][i] * Math.abs(xArr[j][i])

      iArr[j][i] = uSub4
    }
  }

  // performs viscosity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const plant = slot(plants, cell(sArr, j, i) - 11)

      const vSub1 = 1 / (1 - plant.phi) // hardcoded to set 11 as first plant state index
      const vSub2 = Math.min(10, 2 * ((plant.a0 * params.nu) / ((yArr[j][i] + (yArr[j][i] === 0)) * plant.diameter) + plant.a1))
      const vSub3 = -(1 / 2) * vSub1 * params.rho * vSub2 * plant.density * plant.diameter
      const vSub4 = vSub3 * yArr[j][i] * Math.abs(yArr[j][i])

      // if (j === ROWS - 1 && i === 1) console.log('uSub1: ' + vSub1 + '\nuSub2: ' + vSub2 + '\nuSub3: ' + vSub3 + '\nuSub4: ' + vSub4)

      jArr[j][i] = vSub4
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
        n: aX[j][i].n * edge(sArr, xArr, j - 1, i, j, i),
        s: aX[j][i].s * edge(sArr, xArr, j + 1, i, j, i),
        w: aX[j][i].w * edge(sArr, xArr, j, i - 1, j, i),
        e: aX[j][i].e * edge(sArr, xArr, j, i + 1, j, i)
      }

      const wx = (cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j, i - 1) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j, i - 1) !== 0 &&
                  cell(sArr, j - 1, i) !== 0 &&
                  cell(sArr, j + 1, i) !== 0 &&
                  cell(sArr, j - 1, i - 1) !== 0 &&
                  cell(sArr, j + 1, i - 1) !== 0)

      // returns true if inlet cell adjacent to wall in x-axis
      const inL = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 1
      const inR = cell(sArr, j, i) === 0 && cell(sArr, j, i - 1) === 1

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
        n: aY[j][i].n * edge(sArr, yArr, j - 1, i, j, i),
        s: aY[j][i].s * edge(sArr, yArr, j + 1, i, j, i),
        w: aY[j][i].w * edge(sArr, yArr, j, i - 1, j, i),
        e: aY[j][i].e * edge(sArr, yArr, j, i + 1, j, i)
      }

      const wy = (cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j - 1, i) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j - 1, i) !== 0 &&
                  cell(sArr, j, i - 1) !== 0 &&
                  cell(sArr, j, i + 1) !== 0 &&
                  cell(sArr, j - 1, i - 1) !== 0 &&
                  cell(sArr, j - 1, i + 1) !== 0)

      // returns true if inlet cell adjacent to wall in y-axis
      const inU = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 1
      const inD = cell(sArr, j, i) === 0 && cell(sArr, j - 1, i) === 1

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

function jacobi (sArr, pArr, xArr, yArr, xA, yA) {
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

      kArr[j][i] = (pSub1 + pSub2 / pSub3) * (cell(sArr, j, i) !== 0)

      // kArr[j][i] = p.n + p.s + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
    }
  }

  return kArr
}

function correct (sArr, pArr, qArr, xArr, yArr, xA, yA) {
  const iArr = zeros(ROWS, COLS + 1)
  const jArr = zeros(ROWS + 1, COLS)
  const kArr = zeros(ROWS, COLS)

  // performs velocity calculation in x-axis
  for (let j = 0; j < kArr.length; j++) {
    for (let i = 0; i < kArr[j].length; i++) {
      kArr[j][i] = pArr[j][i] + qArr[j][i]
    }
  }

  // performs velocity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const wx = (cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j, i - 1) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j - 1, i) !== 0 &&
                  cell(sArr, j + 1, i) !== 0 &&
                  cell(sArr, j, i - 1) !== 0 &&
                  cell(sArr, j - 1, i - 1) !== 0 &&
                  cell(sArr, j + 1, i - 1) !== 0)

      // returns true if inlet cell adjacent to wall in x-axis
      const inL = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 1
      const inR = cell(sArr, j, i - 1) === 1 && cell(sArr, j, i) === 0

      const outX = cell(xArr, j, i) + (cell(qArr, j, i - 1) - cell(qArr, j, i)) * (params.size / xA[j][i].c)

      iArr[j][i] = wx * outX * !(inL || inR) + (inL ^ inR) * params.input.x // either returns calculated value or inlet value
    }
  }

  // performs velocity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      // returns true if inlet cell adjacent to wall in y-axis

      const wy = (cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 2) ||
                 (cell(sArr, j - 1, i) === 2 && cell(sArr, j, i) === 0) ||
                 (cell(sArr, j, i) !== 0 &&
                  cell(sArr, j - 1, i) !== 0 &&
                  cell(sArr, j, i - 1) !== 0 &&
                  cell(sArr, j, i + 1) !== 0 &&
                  cell(sArr, j - 1, i - 1) !== 0 &&
                  cell(sArr, j - 1, i + 1) !== 0)

      const inU = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 1
      const inD = cell(sArr, j - 1, i) === 1 && cell(sArr, j, i) === 0

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

function converge (sArr, xArr, yArr, iArr, jArr) {
  let diff = 0
  let step = 0

  for (let j = 0; j < sArr.length; j++) {
    for (let i = 0; i < sArr[j].length; i++) {
      step += sArr[j][i] !== 0 // increments if cell isn't a wall
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

module.exports = {
  zeros,
  cell,
  edge,
  slot,
  diffuse,
  coefficients,
  viscosity,
  drag,
  couple,
  jacobi,
  correct,
  converge
}
