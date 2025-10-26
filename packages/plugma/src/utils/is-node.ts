// Add environment detection helper
export function isNode() {
	return typeof process !== 'undefined' && process.versions?.node;
}
