import { expect, test } from 'plugma/vitest';
import { launchPlugin } from 'plugma';
import { createRectangle } from '../src/create-rectangle-helper';

const TEST_COLOR = {
	r: Math.random(),
	g: Math.random(),
	b: Math.random(),
};

function clearCanvas() {
	figma.currentPage.children.forEach((child) => {
		child.remove();
	});
}

launchPlugin('plugma-sandbox', { returnToEditor: true });

test('creates a rectangle', async () => {
	clearCanvas();

	const rect = createRectangle({ color: TEST_COLOR, width: 200, height: 200 });

	expect(rect.type).to.equal('RECTANGLE');
	expect(rect.width).to.equal(200);
	expect(rect.height).to.equal(200);

	return rect;
});

test("verifies the last created rectangle's color", async () => {
	const lastNode = figma.currentPage.children[figma.currentPage.children.length - 1];

	expect(lastNode.type).to.equal('RECTANGLE');

	const firstFill = ((lastNode as RectangleNode).fills as Paint[])[0];

	const color = (firstFill as SolidPaint).color;

	expect(firstFill?.type).to.equal('SOLID');

	expect(color.r).to.be.approximately(TEST_COLOR.r, 0.0001);
	expect(color.g).to.be.approximately(TEST_COLOR.g, 0.0001);
	expect(color.b).to.be.approximately(TEST_COLOR.b, 0.0001);

	return firstFill;
});
