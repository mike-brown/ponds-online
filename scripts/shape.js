var in_old = zeros(2, 2) // old values
var in_new = zeros(2, 2) // new values
var in_tmp = zeros(2, 2) // old values (preserved)



in_new[0][0].velocity.x = 0.1
in_new[0][0].velocity.y = 0.1

in_new[0][1].velocity.x = 0
in_new[0][1].velocity.y = 0

in_new[1][0].velocity.x = 0
in_new[1][0].velocity.y = 0

in_new[1][1].velocity.x = 0.4
in_new[1][1].velocity.y = 0.4

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
				y: parseInt(Math.floor(y_old) + 1)
			}

			let q21 = {
				x: parseInt(Math.floor(x_old) + 1),
				y: parseInt(Math.floor(y_old))
			}

			let q22 = {
				x: parseInt(Math.floor(x_old) + 1),
				y: parseInt(Math.floor(y_old) + 1)
			}

			console.log(bilinear(arr, x, y, q11, q12, q21, q22))

		//	out[x][y] = 
		}
	}
}

function bilinear(arr, x, y, q11, q12, q21, q22) {
	const d = {
		x:  x,
		y:  y,
		x1: q11.x,
		y1: q11.y,
		x2: q22.x,
		y2: q22.y,

		v11: border(arr, q11),
		v12: border(arr, q12),
		v21: border(arr, q21),
		v22: border(arr, q22)
	}

	let term = 1 / (d.x2 - d.x1) * (d.y2 - d.y1)

	// performs x-axis velocity computation of interpolation
	let vx = (((d.x2 - d.x) * d.v11.x) + ((d.x - d.x1) * d.v21.x)) * (d.y2 - d.y)
		   + (((d.x2 - d.x) * d.v12.x) + ((d.x - d.x1) * d.v22.x)) * (d.y - d.y1)

	// performs y-axis velocity computation of interpolation
	let vy = (((d.x2 - d.x) * d.v11.y) + ((d.x - d.x1) * d.v21.y)) * (d.y2 - d.y)
		   + (((d.x2 - d.x) * d.v12.y) + ((d.x - d.x1) * d.v22.y)) * (d.y - d.y1)

	return {
		vx:  term * vx,
		vy:  term * vy
	}
}

function border(arr, q) {
	let v = {
		x: 0,
		y: 0
	}

	if (q.x >= 0 && q.x < arr.length && q.y >= 0 && q.y < arr[0].length) {
		v = {
			x: arr[q.x][q.y].velocity.x,
			y: arr[q.x][q.y].velocity.y
		}
	}

	return v
}

function run() {
	advect(in_new)
}

window.addEventListener("DOMContentLoaded", function() {
	run()
}, false)