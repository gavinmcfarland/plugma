import { expect, test } from 'plugma/vitest';

const TEST_COLOR = {
	r: Math.random(),
	g: Math.random(),
	b: Math.random(),
};

test('creates an ellipse', async () => {
	const rect = figma.createEllipse();

	rect.x = 0;
	rect.y = 0;
	rect.resize(200, 200);

	rect.fills = [{ type: 'SOLID', color: TEST_COLOR }];

	expect(rect.type).to.equal('ELLIPSE');
	expect(rect.width).to.equal(200);
	expect(rect.height).to.equal(200);
});
