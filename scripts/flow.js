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

  console.log(dArr)

  return dArr
}

function concentrations (sArr, cArr, d) {
  let mArr = zeros(ROWS, COLS)

  // performs concentration calculation
  for (let j = 0; j < mArr.length; j++) {
    for (let i = 0; i < mArr[j].length; i++) {
      const nSub = cell(cArr, j - 1, i) * (cell(sArr, j - 1, i) !== 0) // takes cell to the north
      const sSub = cell(cArr, j + 1, i) * (cell(sArr, j + 1, i) !== 0) // takes cell to the south
      const wSub = cell(cArr, j, i - 1) * (cell(sArr, j, i - 1) !== 0) // takes cell to the west
      const eSub = cell(cArr, j, i + 1) * (cell(sArr, j, i + 1) !== 0) // takes cell to the east
      // const cSub = 4 * cArr[j][i] // takes center cell

      mArr[j][i] = d * (nSub + sSub + wSub + eSub/* - cSub*/) / 4 * (sArr[j][i] !== 0) // calculates concentration coefficient
    }
  }

  return mArr
}

function corrections (sArr, xArr, yArr, cArr) {
  let mArr = zeros(ROWS, COLS)

  for (let j = 0; j < mArr.length; j++) {
    for (let i = 0; i < mArr[j].length; i++) {
      const nSub = cell(cArr, j - 1, i) * cell(yArr, j, i)
      const sSub = cell(cArr, j + 1, i) * cell(yArr, j + 1, i)
      const wSub = cell(cArr, j, i - 1) * cell(xArr, j, i)
      const eSub = cell(cArr, j, i + 1) * cell(xArr, j, i + 1)

      mArr[j][i] = (cArr[j][i] - nSub - sSub - wSub - eSub) * (sArr[j][i] !== 0) // calculates corrected concentration values
    }
  }

  console.log(mArr[9][5] + '\n' + mArr[9][COLS - 1])

  return mArr
}

function record (sArr, cArr) {
  let mArr = zeros(ROWS, COLS)
  let mVal = 0

  for (let j = 0; j < mArr.length; j++) {
    for (let i = 0; i < mArr[j].length; i++) {
      mVal += cArr[j][i] * (sArr[j][i] === 2)
      mArr[j][i] = cArr[j][i] * (sArr[j][i] !== 2)
    }
  }

  return [
    mArr,
    mVal
  ]
}

module.exports = {
  dye,
  concentrations,
  corrections,
  record
}
