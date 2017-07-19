'use strict'

const {
  zeros,
  cell
} = require('./fluid') // imports simulation functions from fluid.js file

const {
  COLS,
  ROWS
} = require('./config')

/**
 * Supplies 2D array with inlet cells full of dye.
 * @param {object} sArr - the 2D array of cell states
 * @returns a collection of cells; some of which contain dye
 */
function dye (sArr) {
  let dArr = zeros(ROWS, COLS)

  for (let j = 0; j < dArr.length; j++) {
    for (let i = 0; i < dArr[j].length; i++) {
      dArr[j][i] = sArr[j][i] === 1 // if inlet, add dye
    }
  }

  console.log(dArr)

  return dArr
}

/**
 * Calculates initial concentrations of dye from surrounding concentrations.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} cArr - the 2D array of concentration values
 * @param {number} d -the interface diffusion coefficient
 * @returns a collection of concentration values
 */
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

      // TODO: supply correct concentration calculations; as current results are incorrect

      mArr[j][i] = d * (nSub + sSub + wSub + eSub/* - cSub*/) / 4 * (sArr[j][i] !== 0) // calculates concentration coefficient
    }
  }

  return mArr
}

/**
 * Calculates corrected concentrations of dye from surrounding concentrations and velocities.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} xArr - the 2D array of x-velocity values
 * @param {object} yArr - the 2D array of y-velocity values
 * @param {object} cArr - the 2D array of concentration values
 * @returns a collection of corrected concentration values
 */
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

  return mArr
}

/**
 * Calculates the amount of dye to each an outlet; and subsequently removed from the array.
 * @param {object} sArr - the 2D array of cell states
 * @param {object} cArr - the 2D array of concentration values
 * @returns amount of dye reaching outlet at current step and updated concentration values
 */
function record (sArr, cArr) {
  let mArr = zeros(ROWS, COLS)
  let mVal = 0

  for (let j = 0; j < mArr.length; j++) {
    for (let i = 0; i < mArr[j].length; i++) {
      mVal += cArr[j][i] * (sArr[j][i] === 2) // adds dye concentration to current step quantity if outlet
      mArr[j][i] = cArr[j][i] * (sArr[j][i] !== 2) // removes dye concentration from current cell if outlet
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
