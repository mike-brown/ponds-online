'use strict'

const {
  plants
} = require('./config')

/**
 * Creates a 2D array of cells; each set to a value of zero.
 * @param {number} ROWS - the number of rows
 * @param {number} COLS - the number of columns
 * @returns {object} a list of lists; populated with zeros
 * @example
 * // returns [[0, 0], [0, 0]]
 * zeros(2, 2)
 */
function zeros (rows, cols) {
  let grid = []
  for (let j = 0; j < rows; j++) {
    let line = []
    for (let i = 0; i < cols; i++) {
      line.push(0) // for each column, push a zero to the list
    }
    grid.push(line) // for each row, push a line to the list
  }
  return grid
}

/**
 * Calculates the hypotenuse of a triangle with known side lengths.
 * @param {number} a - the first side length of the triangle
 * @param {number} b - the second side length of the triangle
 * @returns {number} the hypotenuse of the triangle
 * @example
 * // returns 5
 * pyth(3, 4)
 */
function pyth (a, b) {
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
}

/**
 * Supplies the value of the specified cell; or zero if out of bounds.
 * @param {object} arr - the 2D array to be evaluated
 * @param {number} j - the y-axis index
 * @param {number} i - the x-axis index
 * @returns {number} the value of the cell specified, or zero if out of bounds
 * @example
 * // return 2
 * cell([[1, 2], [3, 4]], 0, 1)
 * @example
 * // return 0
 * cell([[1, 2], [3, 4]], 9, 9)
 */
function cell (arr, j, i) {
  const bx = i >= 0 && i < arr[0].length
  const by = j >= 0 && j < arr.length
  const bz = bx && by

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)

  // returns zero if cell does not fall within the supplied array range
  return arr[mj][mi] * bz
}

/**
 * Supplies the value of either specified cell; or zero if both out of bounds.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} arr - the 2D array to be evaluated
 * @param {number} j - the primary y-axis index
 * @param {number} i - the primary x-axis index
 * @param {number} dj - the secondary y-axis index
 * @param {number} di - the secondary x-axis index
 */
function edge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i) !== 0 // returns zero if wall
  const wdz = cell(sArr, dj, di) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz * wdz
}

/**
 * Supplies the value of either specified cell; or zero if both out of bounds.
 *
 * Similar to other edge functions, except the state array is offset by
 * one in the x-axis.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} arr - the 2D array to be evaluated
 * @param {number} j - the primary y-axis index
 * @param {number} i - the primary x-axis index
 * @param {number} dj - the secondary y-axis index
 * @param {number} di - the secondary x-axis index
 */
function eastedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i - 1) !== 0 // returns zero if wall
  const wdz = cell(sArr, dj, di - 1) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz * wdz
}

/**
 * Supplies the value of either specified cell; or zero if both out of bounds.
 *
 * Similar to other edge functions, except the state array is offset by
 * one in the y-axis.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} arr - the 2D array to be evaluated
 * @param {number} j - the primary y-axis index
 * @param {number} i - the primary x-axis index
 * @param {number} dj - the secondary y-axis index
 * @param {number} di - the secondary x-axis index
 */
function downedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j - 1, i) !== 0 // returns zero if wall
  const wdz = cell(sArr, dj - 1, di) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz * wdz
}

/**
 * Supplies the value of the first cell; or the second cell if out of bounds.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} arr - the 2D array to be evaluated
 * @param {number} j - the primary y-axis index
 * @param {number} i - the primary x-axis index
 * @param {number} dj - the secondary y-axis index
 * @param {number} di - the secondary x-axis index
 */
function softedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
}

/**
 * Supplies the value of the first cell; or the second cell if out of bounds.
 *
 * Similar to other soft-edge functions, except the state array is offset by
 * one in the x-axis.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} arr - the 2D array to be evaluated
 * @param {number} j - the primary y-axis index
 * @param {number} i - the primary x-axis index
 * @param {number} dj - the secondary y-axis index
 * @param {number} di - the secondary x-axis index
 */
function softeastedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j, i - 1) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
}

/**
 * Supplies the value of the first cell; or the second cell if out of bounds.
 *
 * Similar to other soft-edge functions, except the state array is offset by
 * one in the y-axis.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} arr - the 2D array to be evaluated
 * @param {number} j - the primary y-axis index
 * @param {number} i - the primary x-axis index
 * @param {number} dj - the secondary y-axis index
 * @param {number} di - the secondary x-axis index
 */
function softdownedge (sArr, arr, j, i, dj, di) {
  const wz = cell(sArr, j - 1, i) !== 0 // returns zero if wall

  const mi = Math.max(Math.min(i, arr[0].length - 1), 0)
  const mj = Math.max(Math.min(j, arr.length - 1), 0)
  const mdi = Math.max(Math.min(di, arr[0].length - 1), 0)
  const mdj = Math.max(Math.min(dj, arr.length - 1), 0)

  // returns cell on closest edge of array, based on supplied j and i values
  return arr[mj][mi] * wz + arr[mdj][mdi] * !wz
}

/**
 * Supplies a collection of weighted coefficients.
 * @param {object} f - a collection of flux values
 * @param {number} diff - the interface diffusion coefficient
 * @returns a collection of a-values
 */
function diffuse (f, diff) {
  const a = [
    diff + Math.max(f[0], 0), // a_n = D_n + max(F_n, 0)
    diff + Math.max(-f[1], 0), // a_s = D_s + max(-F_s, 0)
    diff + Math.max(f[2], 0), // a_w = D_w + max(F_w, 0)
    diff + Math.max(-f[3], 0) // a_e = D_e + max(-F_e, 0)
  ]

  return [
    a[0], // north
    a[1], // south
    a[2], // west
    a[3], // east
    a[0] + a[1] + a[2] + a[3] + (f[3] - f[2]) + (f[1] - f[0]) // a_c = a_n + a_s + a_w + a_e + d_F
  ]
}

/**
 * Supplies a collection of weighted coefficients.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} xArr - the 2D array of x-velocity values
 * @param {object} yArr - the 2D array of y-velocity values
 * @param {number} dens - the density coefficient
 * @param {number} diff - the interface diffusion coefficient
 * @returns a collection of a-values for the x-axis
 */
function ax (sArr, xArr, yArr, rows, cols, dens, diff) {
  let iArr = zeros(rows, cols + 1)

  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const f = [
        dens * (edge(sArr, yArr, j, i - 1, j, i) +
                edge(sArr, yArr, j, i, j, i - 1)),
        dens * (downedge(sArr, yArr, j + 1, i - 1, j + 1, i) +
                downedge(sArr, yArr, j + 1, i, j + 1, i - 1)),
        dens * (edge(sArr, xArr, j, i - 1, j, i) +
                edge(sArr, xArr, j, i, j, i - 1)),
        dens * (eastedge(sArr, xArr, j, i, j, i + 1) +
                eastedge(sArr, xArr, j, i + 1, j, i))
      ]

      iArr[j][i] = diffuse(f, diff)
    }
  }

  return iArr
}

/**
 * Supplies a collection of weighted coefficients.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} xArr - the 2D array of x-velocity values
 * @param {object} yArr - the 2D array of y-velocity values
 * @param {number} dens - the density coefficient
 * @param {number} diff - the interface diffusion coefficient
 * @returns a collection of a-values for the y-axis
 */
function ay (sArr, xArr, yArr, rows, cols, dens, diff) {
  let jArr = zeros(rows + 1, cols)

  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const f = [
        dens * (edge(sArr, yArr, j - 1, i, j, i) +
                edge(sArr, yArr, j, i, j - 1, i)),
        dens * (downedge(sArr, yArr, j, i, j + 1, i) +
                downedge(sArr, yArr, j + 1, i, j, i)),
        dens * (edge(sArr, xArr, j - 1, i, j, i) +
                edge(sArr, xArr, j, i, j - 1, i)),
        dens * (eastedge(sArr, xArr, j - 1, i + 1, j, i + 1) +
                eastedge(sArr, xArr, j, i + 1, j - 1, i + 1))
      ]

      jArr[j][i] = diffuse(f, diff)
    }
  }

  return jArr
}

/**
 * Supplies a 2D arrray of viscosity coefficients
 * @param {object} xArr - the 2D array of x-velocity values
 * @param {object} yArr - the 2D array of y-velocity values
 * @param {number} mu - the dynamic viscosity of water
 * @returns a collection of viscosity values
 */
function viscosity (xArr, yArr, rows, cols, mu) {
  let iArr = zeros(rows, cols + 1)
  let jArr = zeros(rows + 1, cols)

  // performs viscosity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const uSub1 = cell(xArr, j, i + 1) // takes cell to the east
      const uSub2 = 2 * xArr[j][i] // takes center cell
      const uSub3 = cell(xArr, j, i - 1) // takes cell to the west

      iArr[j][i] = mu * (uSub1 - uSub2 + uSub3) // calculates x-velocity viscosity coefficient
    }
  }

  // performs viscosity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const vSub1 = cell(yArr, j + 1, i) // takes cell to the south
      const vSub2 = 2 * yArr[j][i] // takes center cell
      const vSub3 = cell(yArr, j - 1, i) // takes cell to the north

      jArr[j][i] = mu * (vSub1 - vSub2 + vSub3) // calculates y-velocity viscosity coefficient
    }
  }

  return [
    iArr,
    jArr
  ]
}

/**
 * Supplies a collection of drag coefficients.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} xArr - the 2D array of x-velocity values
 * @param {object} yArr - the 2D array of y-velocity values
 * @param {number} nu - the kinematic viscosity of water
 * @param {number} rho - the density of water
 * @returns a collection of drag values
 */
function drag (sArr, xArr, yArr, rows, cols, nu, rho) {
  let iArr = zeros(rows, cols + 1)
  let jArr = zeros(rows + 1, cols)

  // performs viscosity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const p = plants.find(pt => pt[2] === cell(sArr, j, i)) || plants[0] // selects plant properties from list based on state value

      const c = [
        p[3] * nu,
        4 * p[1] / (p[0] * Math.PI)
      ]

      const reynold = pyth(
        cell(xArr, j, i) + cell(xArr, j, i + 1),
        cell(yArr, j, i) + cell(yArr, j + 1, i)
      )

      const uSub1 = 1 / (1 - p[1]) // hardcoded to set 11 as first plant state index
      const uSub2 = c[0] / ((reynold + (reynold === 0)) * p[0]) + p[4] // the "reynold === 0" circumvents divide-by-zero error
      const uSub3 = -(uSub1 * rho * Math.min(10, 2 * uSub2) * c[1]) / 2

      iArr[j][i] = uSub3 * xArr[j][i] * Math.abs(xArr[j][i])
    }
  }

  // performs viscosity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const p = plants.find(pt => pt[2] === cell(sArr, j, i)) || plants[0] // selects plant properties from list based on state value

      const c = [
        p[3] * nu,
        4 * p[1] / (p[0] * Math.PI)
      ]

      const reynold = pyth(
        cell(xArr, j, i) + cell(xArr, j, i + 1),
        cell(yArr, j, i) + cell(yArr, j + 1, i)
      )

      const vSub1 = 1 / (1 - p[1]) // hardcoded to set 11 as first plant state index
      const vSub2 = c[0] / ((reynold + (reynold === 0)) * p[0]) + p[4] // the "reynold === 0" circumvents divide-by-zero error
      const vSub3 = -(vSub1 * rho * Math.min(10, 2 * vSub2) * c[1]) / 2

      jArr[j][i] = vSub3 * yArr[j][i] * Math.abs(yArr[j][i])
    }
  }

  return [
    iArr,
    jArr
  ]
}

/**
 * Supplies a 2D array of pressure-velocity coupling values.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} pArr - the 2D array of pressure values
 * @param {object} xArr - the 2D array of x-velocity values
 * @param {object} yArr - the 2D array of y-velocity values
 * @param {object} xA - the a-values for the x-axis
 * @param {object} yA - the a-values for the y-axis
 * @param {number} size - the face area of the cell
 * @param {number} mu - the dynamic viscosity of water
 * @param {number} nu -the static viscosity of water
 * @param {number} rho - the density of water
 * @param {number} xI - the x-velocity inlet values
 * @param {number} yI - the y-velocity inlet values
 * @returns a collection of coupled pressure-velocity values
 */
function couple (sArr, pArr, xArr, yArr, rows, cols, xA, yA, size, mu, nu, rho, xI, yI) {
  let iArr = zeros(rows, cols + 1)
  let jArr = zeros(rows + 1, cols)

  const [
    iVis,
    jVis
  ] = viscosity(xArr, yArr, mu)

  const [
    iForce,
    jForce
  ] = drag(sArr, xArr, yArr, nu, rho)

  // performs velocity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const vx = [
        xA[j][i][0] * softedge(sArr, xArr, j - 1, i, j, i), // north
        xA[j][i][1] * softedge(sArr, xArr, j + 1, i, j, i), // south
        xA[j][i][2] * softedge(sArr, xArr, j, i - 1, j, i), // west
        xA[j][i][3] * softeastedge(sArr, xArr, j, i + 1, j, i) // east
      ]

      const wx = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 2 ||
                cell(sArr, j, i - 1) === 2 && cell(sArr, j, i) === 0 ||
                cell(sArr, j, i) !== 0 &&
                cell(sArr, j, i - 1) !== 0 &&
                (cell(sArr, j + 1, i) !== 0 ||
                cell(sArr, j + 1, i - 1) !== 0) &&
                (cell(sArr, j - 1, i) !== 0 ||
                cell(sArr, j - 1, i - 1) !== 0)

      // returns true if inlet cell adjacent to wall in x-axis
      const inL = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 1
      const inR = cell(sArr, j, i) === 0 && cell(sArr, j, i - 1) === 1

      const uSub1 = vx[0] + vx[1] + vx[2] + vx[3]
      const uSub2 = cell(pArr, j, i - 1) - cell(pArr, j, i)
      const uSub3 = (uSub1 + uSub2 * size + iVis[j][i] + iForce[j][i]) * wx

      iArr[j][i] = uSub3 * !(inL || inR) / xA[j][i][4] + (inL ^ inR) * xI // either returns calculated value or inlet value
    }
  }

  // performs velocity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const vy = [
        yA[j][i][0] * softedge(sArr, yArr, j - 1, i, j, i),
        yA[j][i][1] * softdownedge(sArr, yArr, j + 1, i, j, i),
        yA[j][i][2] * softedge(sArr, yArr, j, i - 1, j, i),
        yA[j][i][3] * softedge(sArr, yArr, j, i + 1, j, i)
      ]

      const wy = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 2 ||
                cell(sArr, j - 1, i) === 2 && cell(sArr, j, i) === 0 ||
                cell(sArr, j, i) !== 0 &&
                cell(sArr, j - 1, i) !== 0 &&
                (cell(sArr, j, i - 1) !== 0 ||
                cell(sArr, j - 1, i - 1) !== 0) &&
                (cell(sArr, j, i + 1) !== 0 ||
                cell(sArr, j - 1, i + 1) !== 0)

      // returns true if inlet cell adjacent to wall in y-axis
      const inU = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 1
      const inD = cell(sArr, j, i) === 0 && cell(sArr, j - 1, i) === 1

      const vSub1 = vy[0] + vy[1] + vy[2] + vy[3]
      const vSub2 = cell(pArr, j - 1, i) - cell(pArr, j, i)
      const vSub3 = (vSub1 + vSub2 * size + jVis[j][i] + jForce[j][i]) * wy

      jArr[j][i] = vSub3 * !(inU || inD) / yA[j][i][4] + (inU ^ inD) * yI // either returns calculated value or inlet value
    }
  }

  return [
    iArr,
    jArr
  ]
}

/**
 * Supplies a 2D array of estimated pressure values
 * @param {object} sArr - the 2D array of cell states
 * @param {object} pArr - the 2D array of pressure values
 * @param {object} xArr - the 2D array of x-velocity values
 * @param {object} yArr - the 2D array of y-velocity values
 * @param {object} xA - the a-values for the x-axis
 * @param {object} yA - the a-values for the y-axis
 * @param {number} size - the face area of the cell
 * @returns a collection of estimated pressure values
 */
function jacobi (sArr, pArr, xArr, yArr, rows, cols, xA, yA, size) {
  const kArr = zeros(rows, cols)

  for (let j = 0; j < kArr.length; j++) {
    for (let i = 0; i < kArr[j].length; i++) {
      let vx = [
        xArr[j][i], // west
        xArr[j][i + 1] // east
      ]

      let vy = [
        yArr[j][i], // north
        yArr[j + 1][i] // south
      ]

      const p = [
        cell(pArr, j - 1, i), // north
        cell(pArr, j + 1, i), // south
        cell(pArr, j, i - 1), // west
        cell(pArr, j, i + 1) // east
      ]

      const a = [
        yA[j][i][4], // north
        yA[j + 1][i][4], // south
        xA[j][i][4], // west
        xA[j][i + 1][4] // east
      ]

      let pSub1 = p[0] / a[0] + p[1] / a[1] + p[2] / a[2] + p[3] / a[3] // a_nP'_n + a_sP'_s + a_wP'_w + a_eP'_e
      let pSub2 = (vx[0] - vx[1] + vy[0] - vy[1]) / size // b_ij
      let pSub3 = 1 / a[0] + 1 / a[1] + 1 / a[2] + 1 / a[3]

      kArr[j][i] = (pSub1 + pSub2) / pSub3 * (cell(sArr, j, i) !== 0) // this calculation does not apply correct division formula

      // kArr[j][i] = p.n + p.s + p.w + p.e + (vx.w - vx.e + vy.n - vy.s)
    }
  }

  return kArr
}

/**
 * Supplies a 2D array of corrected pressures and velocities.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} pArr - the 2D array of old pressure values
 * @param {object} qArr - the 2D array of estimated pressure values
 * @param {object} xArr - the 2D array of estimated x-velocity values
 * @param {object} yArr - the 2D array of estimated y-velocity values
 * @param {object} xOld - the 2D array of old x-velocity values
 * @param {object} yOld - the 2D array of old y-velocity values
 * @param {object} xA - the a-values for the x-axis
 * @param {object} yA - the a-values for the y-axis
 * @param {number} size - the face area of the cell
 * @param {number} xI - the x-velocity inlet values
 * @param {number} yI - the y-velocity inlet values
 * @returns a collection of corrected pressure and velocity values
 */
function correct (sArr, pArr, qArr, xArr, yArr, rows, cols, xOld, yOld, xA, yA, size, xI, yI) {
  const iArr = zeros(rows, cols + 1)
  const jArr = zeros(rows + 1, cols)
  const kArr = zeros(rows, cols)

  // performs velocity calculation in x-axis
  for (let j = 0; j < kArr.length; j++) {
    for (let i = 0; i < kArr[j].length; i++) {
      kArr[j][i] = pArr[j][i] + qArr[j][i] * 0.01 // hardcoded under-relaxation factor
    }
  }

  // performs velocity calculation in x-axis
  for (let j = 0; j < iArr.length; j++) {
    for (let i = 0; i < iArr[j].length; i++) {
      const wx = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 2 ||
                cell(sArr, j, i - 1) === 2 && cell(sArr, j, i) === 0 ||
                cell(sArr, j, i) !== 0 &&
                cell(sArr, j, i - 1) !== 0 &&
                (cell(sArr, j + 1, i) !== 0 ||
                cell(sArr, j + 1, i - 1) !== 0) &&
                (cell(sArr, j - 1, i) !== 0 ||
                cell(sArr, j - 1, i - 1) !== 0)

      // returns true if inlet cell adjacent to wall in x-axis
      const inL = cell(sArr, j, i - 1) === 0 && cell(sArr, j, i) === 1
      const inR = cell(sArr, j, i - 1) === 1 && cell(sArr, j, i) === 0

      const outX = xArr[j][i] + (cell(qArr, j, i - 1) - cell(qArr, j, i)) * (size / xA[j][i][4])

      const relX = 0.2 * outX + (1 - 0.2) * xOld[j][i] // hardcoded under-relaxation factor of 0.2

      iArr[j][i] = wx * relX * !(inL || inR) + (inL ^ inR) * xI // either returns calculated value or inlet value
    }
  }

  // performs velocity calculation in y-axis
  for (let j = 0; j < jArr.length; j++) {
    for (let i = 0; i < jArr[j].length; i++) {
      const wy = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 2 ||
                cell(sArr, j - 1, i) === 2 && cell(sArr, j, i) === 0 ||
                cell(sArr, j, i) !== 0 &&
                cell(sArr, j - 1, i) !== 0 &&
                (cell(sArr, j, i - 1) !== 0 ||
                cell(sArr, j - 1, i - 1) !== 0) &&
                (cell(sArr, j, i + 1) !== 0 ||
                cell(sArr, j - 1, i + 1) !== 0)

      // returns true if inlet cell adjacent to wall in y-axis
      const inU = cell(sArr, j - 1, i) === 0 && cell(sArr, j, i) === 1
      const inD = cell(sArr, j - 1, i) === 1 && cell(sArr, j, i) === 0

      const outY = yArr[j][i] + (cell(qArr, j - 1, i) - cell(qArr, j, i)) * (size / yA[j][i][4])

      const relY = 0.2 * outY + (1 - 0.2) * yOld[j][i] // hardcoded under-relaxation factor of 0.2

      jArr[j][i] = wy * relY * !(inU || inD) + (inU ^ inD) * yI // either returns calculated value or inlet value
    }
  }

  return [
    iArr,
    jArr,
    kArr
  ]
}

/**
 * Supplies the rate of change in velocities at the current step.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} xArr - the 2D array of old x-velocity values
 * @param {object} yArr - the 2D array of old y-velocity values
 * @param {object} iArr - the 2D array of estimated x-velocity values
 * @param {object} jArr - the 2D array of estimated y-velocity values
 * @returns the average change in velocity between steps
 */
function converge (sArr, xArr, yArr, iArr, jArr, rows, cols) {
  let temp = 0
  let diff = 0
  let step = 0

  for (let j = 0; j < sArr.length; j++) {
    for (let i = 0; i < sArr[j].length; i++) {
      step += sArr[j][i] !== 0 // increments if cell isn't a wall
    }
  }

  for (let j = 0; j < rows + 1; j++) {
    for (let i = 0; i < cols + 1; i++) {
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
  cell,
  diffuse,
  ax,
  ay,
  couple,
  jacobi,
  correct,
  converge
}
