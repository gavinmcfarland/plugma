/**
 * Generates a random port number between 3000 and 6999.
 * This function is useful for assigning a port for local development servers.
 *
 * @returns {number} A random port number between 3000 and 6999.
 */
export function getRandomPort(): number {
	return Math.floor(Math.random() * (6999 - 3000 + 1)) + 3000;
}

// FIXME: Chrome has a list of restricted ports that it won't allow connections to for security reasons. Some ports are not available on some systems. 6669 is a common port that is restricted.
