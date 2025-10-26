/// <reference types="@figma/plugin-typings" />

// Helper function to check if a value is a Figma node
function isFigmaNode(value: any): boolean {
	return value && typeof value === 'object' && 'type' in value
}

// Helper function to check if a node can have component properties
function canHaveComponentProperties(node: SceneNode): boolean {
	return node.type === 'COMPONENT_SET' || (node.type === 'COMPONENT' && !node.parent?.type?.includes('COMPONENT_SET'))
}

// Helper function to serialize a Figma paint
function serializePaint(paint: any): any {
	if (!paint) return null

	const result: any = {
		type: paint.type,
		visible: paint.visible,
		opacity: paint.opacity,
	}

	if ('blendMode' in paint) {
		result.blendMode = paint.blendMode
	}

	switch (paint.type) {
		case 'SOLID':
			result.color = {
				r: paint.color.r,
				g: paint.color.g,
				b: paint.color.b,
			}
			break
		case 'GRADIENT_LINEAR':
		case 'GRADIENT_RADIAL':
		case 'GRADIENT_ANGULAR':
		case 'GRADIENT_DIAMOND':
			result.gradientStops = paint.gradientStops.map((stop: any) => ({
				position: stop.position,
				color: {
					r: stop.color.r,
					g: stop.color.g,
					b: stop.color.b,
					a: stop.color.a,
				},
			}))
			result.gradientTransform = paint.gradientTransform
			break
		case 'IMAGE':
			result.scaleMode = paint.scaleMode
			result.imageHash = paint.imageHash
			result.filters = paint.filters
			break
	}

	return result
}

// Helper function to serialize a Figma effect
function serializeEffect(effect: any): any {
	if (!effect) return null

	const result: any = {
		type: effect.type,
		visible: effect.visible,
	}

	if ('blendMode' in effect) {
		result.blendMode = effect.blendMode
	}

	switch (effect.type) {
		case 'DROP_SHADOW':
		case 'INNER_SHADOW':
			result.color = {
				r: effect.color.r,
				g: effect.color.g,
				b: effect.color.b,
				a: effect.color.a,
			}
			result.offset = effect.offset
			result.radius = effect.radius
			result.spread = effect.spread
			break
		case 'LAYER_BLUR':
		case 'BACKGROUND_BLUR':
			result.radius = effect.radius
			break
	}

	return result
}

// Helper function to serialize a Figma constraint
function serializeConstraint(constraint: any): any {
	if (!constraint) return null

	return {
		type: constraint.type,
		value: constraint.value,
	}
}

// Helper function to serialize a Figma layout mode
function serializeLayoutMode(layoutMode: any): any {
	if (!layoutMode) return null

	return {
		type: layoutMode.type,
		primaryAxisSizingMode: layoutMode.primaryAxisSizingMode,
		counterAxisSizingMode: layoutMode.counterAxisSizingMode,
		primaryAxisAlignItems: layoutMode.primaryAxisAlignItems,
		counterAxisAlignItems: layoutMode.counterAxisAlignItems,
		paddingLeft: layoutMode.paddingLeft,
		paddingRight: layoutMode.paddingRight,
		paddingTop: layoutMode.paddingTop,
		paddingBottom: layoutMode.paddingBottom,
		itemSpacing: layoutMode.itemSpacing,
	}
}

// Helper function to check if a node has layout properties
function hasLayoutProperties(node: any): boolean {
	return ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(node.type)
}

export function nodeToObject(node: any, seen = new WeakSet()): any {
	// Handle array of nodes
	if (Array.isArray(node)) {
		return node.map((item) => nodeToObject(item, seen))
	}

	// Handle circular references
	if (seen.has(node)) {
		return { type: node.type, id: node.id, name: node.name, _circular: true }
	}
	seen.add(node)

	let result: any = {
		type: node.type,
		id: node.id,
		name: node.name,
	}

	try {
		// Common properties for all nodes
		if ('visible' in node) result.visible = node.visible
		if ('locked' in node) result.locked = node.locked
		if ('opacity' in node) result.opacity = node.opacity
		if ('blendMode' in node) result.blendMode = node.blendMode
		if ('preserveRatio' in node) result.preserveRatio = node.preserveRatio
		if ('layoutAlign' in node) result.layoutAlign = node.layoutAlign
		if ('layoutGrow' in node) result.layoutGrow = node.layoutGrow
		if ('constraints' in node) result.constraints = serializeConstraint(node.constraints)
		if ('layoutMode' in node) result.layoutMode = serializeLayoutMode(node.layoutMode)

		// Type-specific properties
		switch (node.type) {
			case 'RECTANGLE':
			case 'ELLIPSE':
			case 'POLYGON':
			case 'STAR':
			case 'VECTOR':
			case 'LINE':
			case 'TEXT':
				result.fills = Array.isArray(node.fills) ? node.fills.map(serializePaint) : []
				result.strokes = Array.isArray(node.strokes) ? node.strokes.map(serializePaint) : []
				result.strokeWeight = node.strokeWeight
				result.strokeAlign = node.strokeAlign
				result.strokeCap = node.strokeCap
				result.strokeJoin = node.strokeJoin
				result.strokeMiterLimit = node.strokeMiterLimit
				result.dashPattern = node.dashPattern
				result.effects = Array.isArray(node.effects) ? node.effects.map(serializeEffect) : []
				result.size = { x: node.width, y: node.height }
				result.rotation = node.rotation
				result.x = node.x
				result.y = node.y
				break

			case 'TEXT':
				result.characters = node.characters
				result.fontSize = node.fontSize
				result.fontName = node.fontName
				result.textAlignHorizontal = node.textAlignHorizontal
				result.textAlignVertical = node.textAlignVertical
				result.letterSpacing = node.letterSpacing
				result.lineHeight = node.lineHeight
				result.textCase = node.textCase
				result.textDecoration = node.textDecoration
				break

			case 'FRAME':
			case 'GROUP':
			case 'COMPONENT':
			case 'COMPONENT_SET':
			case 'INSTANCE':
				result.children = node.children?.map((child: any) => nodeToObject(child, seen))

				if (hasLayoutProperties(node)) {
					result.clipsContent = node.clipsContent
					result.layoutMode = node.layoutMode
					result.primaryAxisSizingMode = node.primaryAxisSizingMode
					result.counterAxisSizingMode = node.counterAxisSizingMode
					result.primaryAxisAlignItems = node.primaryAxisAlignItems
					result.counterAxisAlignItems = node.counterAxisAlignItems
					result.paddingLeft = node.paddingLeft
					result.paddingRight = node.paddingRight
					result.paddingTop = node.paddingTop
					result.paddingBottom = node.paddingBottom
					result.itemSpacing = node.itemSpacing
				}
				break

			case 'COMPONENT':
			case 'COMPONENT_SET':
				result.description = node.description
				result.documentationLinks = node.documentationLinks
				break

			case 'INSTANCE':
				result.mainComponent = node.mainComponent
					? {
							id: node.mainComponent.id,
							name: node.mainComponent.name,
						}
					: null
				result.componentProperties = node.componentProperties
				break
		}

		return result
	} catch (error) {
		console.error('Error converting node to object:', error, node)
		throw error
	}
}
