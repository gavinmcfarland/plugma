// Helper function to check if a value is a Figma node
function isFigmaNode(value: any): value is SceneNode {
	return value && typeof value === 'object' && 'type' in value
}

// Helper function to check if a node can have component properties
function canHaveComponentProperties(node: SceneNode): boolean {
	return node.type === 'COMPONENT_SET' || (node.type === 'COMPONENT' && !node.parent?.type?.includes('COMPONENT_SET'))
}

export function nodeToObject(node: SceneNode | SceneNode[]): Record<string, any> | Record<string, any>[] {
	// Handle array of nodes
	if (Array.isArray(node)) {
		return node.map((item) => {
			return nodeToObject(item as SceneNode)
		})
	}

	let result: Record<string, any> = {}

	try {
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

		return result
	} catch (error) {
		console.error('Error converting node to object:', error, node)
		throw error
	}
}
