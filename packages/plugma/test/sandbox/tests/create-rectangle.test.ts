import { expect, test, launchPlugin } from "plugma/testing";

const TEST_COLOR = {
	r: Math.random(),
	g: Math.random(),
	b: Math.random(),
};

launchPlugin("Plugma Test Sandbox", true);

test("creates a rectangle with specific color", async () => {
	const rect = figma.createRectangle();

	rect.x = 0;
	rect.y = 0;
	rect.resize(200, 100);

	rect.fills = [{ type: "SOLID", color: TEST_COLOR }];

	expect(rect.type).to.equal("RECTANGLE");
	expect(rect.width).to.equal(100);
	expect(rect.height).to.equal(100);
	expect(rect.fills[0].type).to.equal("SOLID");

	const color = (rect.fills[0] as SolidPaint).color;
	expect(color.r).to.be.approximately(TEST_COLOR.r, 0.0001);
	expect(color.g).to.be.approximately(TEST_COLOR.g, 0.0001);
	expect(color.b).to.be.approximately(TEST_COLOR.b, 0.0001);
});

// test("verifies the last created rectangle's color", async () => {
//   const lastNode =
//     figma.currentPage.children[figma.currentPage.children.length - 1];

//   expect(lastNode.type).to.equal('RECTANGLE');

//   const firstFill = ((lastNode as RectangleNode).fills as Paint[]).at(0);

//   const color = (firstFill as SolidPaint).color;

//   expect(firstFill?.type).to.equal('SOLID');

//   expect(color.r).to.be.approximately(TEST_COLOR.r, 0.0001);
//   expect(color.g).to.be.approximately(TEST_COLOR.g, 0.0001);
//   expect(color.b).to.be.approximately(TEST_COLOR.b, 0.0001);
// });
