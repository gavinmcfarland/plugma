export function createRectangle({ color, width = 100, height = 100 }: { color: any; width?: number; height?: number }) {
	const rect = figma.createRectangle()

	rect.x = 0
	rect.y = 0
	rect.resize(width, height)

	rect.fills = [{ type: 'SOLID', color }]

	return rect
}
