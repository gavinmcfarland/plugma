/** @jsx figma.widget.h */

const { widget } = figma;
const { AutoLayout, SVG, Text, useSyncedState, usePropertyMenu } = widget;

function Widget() {
	return (
		<AutoLayout
			name="Frame1"
			fill="#0C8CE9"
			cornerRadius={40}
			spacing={8}
			padding={{
				vertical: 10,
				horizontal: 16,
			}}
			horizontalAlignItems="center"
			verticalAlignItems="center"
		>
			<Text
				name="Click me"
				fill="#FFF"
				horizontalAlignText="center"
				fontFamily="Inter"
				fontSize={32}
				fontWeight={500}
			>
				Hello World!
			</Text>
		</AutoLayout>
	);
}

export default function () {
	widget.register(Widget);
}
