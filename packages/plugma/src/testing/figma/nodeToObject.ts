// Helper function to check if a value is a Figma node
function isFigmaNode(value: any): value is SceneNode {
	return value && typeof value === 'object' && 'type' in value
}

export function nodeToObject(node: SceneNode | SceneNode[]): Record<string, any> | Record<string, any>[] {
	// Handle array of nodes
	if (Array.isArray(node)) {
		return node.map((item) => {
			return nodeToObject(item as SceneNode)
		})
	}

	let result: Record<string, any> = {}

	if (isFigmaNode(node)) {
		// Get all properties of the node
		for (const key in node) {
			// Skip functions and internal properties
			if (typeof (node as any)[key] === 'function' || key.startsWith('_')) {
				continue
			}

			const value = (node as any)[key]

			// Handle nested nodes (like children)
			if (Array.isArray(value)) {
				result[key] = value.map((item) => {
					if (isFigmaNode(item)) {
						return nodeToObject(item)
					}
					return item
				})
			}
			// Handle nested objects
			else if (value && typeof value === 'object' && !isFigmaNode(value)) {
				result[key] = { ...value }
			}
			// Handle primitive values
			else {
				result[key] = value
			}
		}
	} else {
		result = node
	}

	console.log('result', result)

	return result
}
