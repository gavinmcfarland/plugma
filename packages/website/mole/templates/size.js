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



export default (theme) => {

	let str = new Str()
	str.append`:where(html) {`

	let i = -2;
	while (i < range(-2, 15).length - 2) {
		let commonRatio = 2
		let baseNumber = 16
		let mod = i < 0 ? "0".repeat(i * -1) : i + 1
		// let mod = i < 0 ? "0" : i + 1
		// let value = 1 * Math.round(Math.pow(theme.number['major second'], i) * 100) / 100
		// let value = 16 * convertNegativeToDecimal(i)
		// let value = 16 * Math.pow(2, i)
		// TODO: Does the value need to include the commonRatio somehow?
		let value = (baseNumber * convertNegativeToDecimal(i))
		let geometricSequence = Math.pow(commonRatio, convertNegativeToDecimal(i))



		let proximity = calculateProximityPercentage(value, baseNumber, commonRatio)
		let suffix = getHighestNValue(value, baseNumber, commonRatio) + 1
		let steps = calculateSteps(value, baseNumber, commonRatio)

		// if (i > 0) {
		// 	steps += "0"
		// }

		console.log(calculateProximityPercentage(value, 16, commonRatio), steps)

		str.append`	--size-${suffix}${proximity}: ${value}px;`
		i++;
	}

	str.append`}`
	// return str.output

}
