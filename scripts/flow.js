'use strict'

const {
  zeros,
  cell
} = require('./fluid') // imports simulation functions from fluid.js file

const {
  COLS,
  ROWS
} = require('./config')

function dye (sArr) {
  let dArr = zeros(ROWS, COLS)

  for (let j = 0; j < dArr.length; j++) {
    for (let i = 0; i < dArr[j].length; i++) {
      dArr[j][i] = sArr[j][i] === 1
    }
  }

  return dArr
}

function concentrations (cArr, d) {
  let mArr = zeros(ROWS, COLS)

  // performs concentration calculation
  for (let j = 0; j < mArr.length; j++) {
    for (let i = 0; i < mArr[j].length; i++) {
      const nSub = cell(cArr, j - 1, i) // takes cell to the north
      const sSub = cell(cArr, j + 1, i) // takes cell to the south
      const wSub = cell(cArr, j, i - 1) // takes cell to the west
      const eSub = cell(cArr, j, i + 1) // takes cell to the east
      const cSub = 4 * cArr[j][i] // takes center cell

      mArr[j][i] = d * (nSub + sSub + wSub + eSub - cSub) // calculates x-velocity concentration coefficient
    }
  }

  return mArr
}

function corrections (xArr, yArr, cArr) {
  let mArr = zeros(ROWS, COLS)

  for (let j = 0; j < mArr.length; j++) {
    for (let i = 0; i < mArr[j].length; i++) {
      const nSub = cell(cArr, j - 1, i) * cell(yArr, j, i)
      const sSub = cell(cArr, j + 1, i) * cell(yArr, j + 1, i)
      const wSub = cell(cArr, j, i - 1) * cell(xArr, j, i)
      const eSub = cell(cArr, j, i + 1) * cell(xArr, j, i + 1)

      mArr[j][i] = cArr[j][i] - nSub - sSub - wSub - eSub
    }
  }

  return mArr
}
