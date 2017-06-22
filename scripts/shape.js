var in_old = zeros(5, 5) // old values
var in_new = zeros(5, 5) // new values
var in_tmp = zeros(5, 5) // old values (preserved)

function zeros(rows, cols) {

	grid = []
	for (let x = 0; x < rows; x++) {

		line = []
		for (let y = 0; y < cols; y++) {
			line.push({
				pressure: 0, // pressure
				velocity: {
					x: 0, // velocity (x-axis)
					y: 0  // velocity (y-axis)
				}
			})
		}
		grid.push(line)
	}
	return grid
}

function advect(arr) {
	out = zeros(5, 5)

	time = 1

	for (let x = 0; x < arr.length; x++) {

		for (let y = 0; y < arr[x].length; y++) {
			let x_old = x - arr[x][y].velocity.x * time
			let y_old = y - arr[x][y].velocity.y * time

			let q11 = {
				x: parseInt(Math.floor(x_old)),
				y: parseInt(Math.floor(y_old))
			}

			let q12 = {
				x: parseInt(Math.floor(x_old)),
				y: parseInt(Math.ceil(y_old))
			}

			let q21 = {
				x: parseInt(Math.ceil(x_old)),
				y: parseInt(Math.floor(y_old))
			}

			let q22 = {
				x: parseInt(Math.ceil(x_old)),
				y: parseInt(Math.ceil(y_old))
			}

			out[x][y] = 
		}
	}
}

function bilinear(x, y, q11, q12, q21, q22) {
	const d = {
		x:  x,
		y:  y,
		x1: q11.x,
		y1: q11.y,
		x2: q22.x,
		y2: q22.y
	}

	let term1 = 1 / (d.x2 - d.x1) * (d.y2 - d.y1)

	// performs x-term computation of interpolation
	let term2 = ((d.x2 - d.x) * (q11.x + q21.x)) * (d.y2 - d.y)
			  + ((d.x - d.x1) * (q12.x + q22.x)) * (d.y - d.y1)

	// performes y-term computation of interpolation
	let term3 = ((d.x2 - d.x) * (q11.y + q21.y)) * (d.y2 - d.y)
			  + ((d.x - d.x1) * (q12.y + q22.y)) * (d.y - d.y1)

	return {
		x: term1 * term2,
		y: term1 * term3
	}
}

function run() {
	while (true) {

	}
}

window.addEventListener("DOMContentLoaded", function() {
	run()
}, false)