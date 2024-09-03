import { Str } from 'str'
import range from '../util/range.js'

// --size-{02-20}

function convertNegativeToDecimal(x) {
	if (x >= 0) {
		return x
	}
	else {
		return 1 / Math.pow(2, Math.abs(x));
	}

}

function isInGeometricSequence(number, a0, r) {
	if (number % a0 !== 0) {
		return false; // If number isn't divisible by a0, it can't be in the sequence
	}

	let quotient = number / a0;

	// Check if quotient is a power of r
	return (quotient > 0) && (Math.log(quotient) / Math.log(r) % 1 === 0);
}

function getNValue(number, a0, r) {
	if (number % a0 !== 0) {
		return -1; // Return -1 if the number is not in the sequence
	}

	let quotient = number / a0;

	// Check if the quotient is a power of r
	if ((quotient > 0) && (Math.log(quotient) / Math.log(r) % 1 === 0)) {
		return Math.log(quotient) / Math.log(r);
	} else {
		return -1; // Return -1 if the number is not in the sequence
	}
}

function getHighestNValue(number, a0, r) {
	if (number < a0) {
		return -1; // Return -1 if the number is less than a0, meaning it's not in the sequence
	}

	let quotient = number / a0;

	// Check if the quotient is a power of r
	if ((quotient > 0) && (Math.log(quotient) / Math.log(r) % 1 === 0)) {
		return Math.log(quotient) / Math.log(r);
	} else {
		// Find the highest power of r less than the quotient
		let highestPower = Math.floor(Math.log(quotient) / Math.log(r));
		return highestPower;
	}
}

function getClosestNValue(number, a0, r) {
	if (number % a0 !== 0) {
		return -1; // If the number isn't divisible by a0, return -1 (invalid input)
	}

	let quotient = number / a0;

	// If the quotient is a power of r, return the exact n value
	if ((quotient > 0) && (Math.log(quotient) / Math.log(r) % 1 === 0)) {
		return Math.log(quotient) / Math.log(r);
	} else {
		// Find the highest n for which r^n is less than the quotient
		let n = Math.floor(Math.log(quotient) / Math.log(r));
		return n; // Return the highest n for which r^n < quotient
	}
}

function calculateSteps(number, a0, r) {
	if (number < a0) {
		// Calculate the difference as a decimal
		let percentageDifference = Math.round(((a0 - number) / a0) * 100);
		if (percentageDifference === 100) {
			percentageDifference = 0;
		}
		return percentageDifference; // Return as a negative decimal
	}

	let quotient = number / a0;

	// Check if the number is already in the sequence
	if ((quotient > 0) && (Math.log(quotient) / Math.log(r) % 1 === 0)) {
		return 0; // No steps needed, it's already in the sequence
	} else {
		// Find the largest power of r less than the number
		let highestPower = Math.floor(Math.log(quotient) / Math.log(r));
		let largestValidNumber = a0 * Math.pow(r, highestPower);

		// Calculate steps
		return (number - largestValidNumber) / a0;
	}
}

function calculateProximityPercentage(number, a0, r) {
	if (number < a0) {
		// Calculate percentage for numbers smaller than the base number
		let percentageDifference = ((a0 - number) / a0) * 100;
		return `-${Math.round(percentageDifference)}`; // Return as a negative whole number percentage
	}

	let quotient = number / a0;

	// Check if the number is already in the sequence
	if ((quotient > 0) && (Math.log(quotient) / Math.log(r) % 1 === 0)) {
		return '00'; // No steps needed, it's already in the sequence
	} else {
		// Find the next and previous powers of r
		let nextPower = Math.ceil(Math.log(number / a0) / Math.log(r));
		let previousPower = nextPower - 1;

		// Compute the next and previous valid numbers
		let nextValidNumber = a0 * Math.pow(r, nextPower);
		let previousValidNumber = a0 * Math.pow(r, previousPower);

		// Calculate the percentage difference
		let percentageDifference = ((number - previousValidNumber) / (nextValidNumber - previousValidNumber)) * 100;
		return Math.round(percentageDifference); // Return as a whole number percentage
	}
}



// export default (theme) => {

// 	let str = new Str()
// 	str.append`:where(html) {`

// 	let i = -8;
// 	while (i < range(-8, 0).length - 8) {
// 		let commonRatio = 2
// 		let baseNumber = 800
// 		let value = (baseNumber * convertNegativeToDecimal(i) * commonRatio)

// 		str.append`	--size-${9 + i}00: ${value}px;`
// 		i++;
// 	}

// 	str.append`}`
// 	return str.output

// }

// export default (theme) => {
// 	let str = new Str();
// 	str.append`:where(html) {`;

// 	let totalSteps = 5; // We need exactly 8 variables
// 	let startValue = 0; // The first value is 0px
// 	let endValue = 128; // The final value should be 800px
// 	let commonRatio = 2; // Modify this ratio as needed

// 	// Calculate the geometric progression scale factor
// 	let scale = endValue / (Math.pow(commonRatio, totalSteps - 1));

// 	// Generate the values
// 	for (let i = 0; i < totalSteps; i++) {
// 		let value = i === 0 ? startValue : scale * (Math.pow(commonRatio, i));
// 		str.append`	--size-${(i)}00: ${Math.ceil(value)}px;`;
// 	}

// 	str.append`}`;
// 	return str.output;
// }

// export default (theme) => {
// 	let str = new Str();
// 	str.append`:where(html) {`;

// 	let totalSteps = 4; // We need exactly 8 variables
// 	let startValue = 0; // The first value is 0px
// 	let endValue = 128; // The final value should be 800px
// 	let commonRatio = 2; // Modify this ratio as needed
// 	let shift = 0

// 	// Calculate the geometric progression scale factor
// 	let scale = (endValue - shift) / (Math.pow(commonRatio, totalSteps));

// 	// Generate the values
// 	for (let i = 0; i < totalSteps + 1; i++) {
// 		let value = i === 0 ? startValue : (scale * (Math.pow(commonRatio, i)));
// 		str.append`	--size-${(i)}00: ${shift + Math.ceil(value)}px;`;
// 	}

// 	str.append`}`;
// 	return str.output;
// }

function output({ steps, start = 0, ratio, total = null, end = null, shift = 0 }) {
	let str = new Str();
	str.append`:where(html) {`;

	let scale;

	let totalSteps = steps;

	if (start > 0) {
		steps = steps - 1; // Reduce the number of totalSteps if startValue is 0
	}

	if (total !== null) {
		// Adjust the total sum to consider the range from startValue to totalSum
		let availableSum = total - start;
		let sumOfSeries = (Math.pow(ratio, steps) - 1) / (ratio - 1);

		// Scale based on the available sum
		scale = availableSum / sumOfSeries;
	} else if (end !== null) {
		// Calculate the scale to fit the range from startValue to endValue
		scale = (end - start) / (Math.pow(ratio, steps - 1));
	} else {
		throw new Error("Either totalSum or endValue must be provided");
	}

	// Generate the values
	for (let i = 0; i <= steps; i++) {
		let value;
		if (i === 0) {
			value = start; // Fixed start value
		} else {
			value = start + Math.ceil(scale * Math.pow(ratio, i - 1));
		}

		let a = i
		if (start > 0) {
			a = i + 1
		}
		str.append`	--size-${a}00: ${shift + value}px;`;
	}

	str.append`}`;
	return str.output;
}




export default (theme) => {

	return output({
		steps: 8,
		ratio: 1.5,
		start: 0,
		total: 510
	})

}






