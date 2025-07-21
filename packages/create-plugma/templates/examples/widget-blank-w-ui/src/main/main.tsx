/** @jsx figma.widget.h */

const { widget } = figma;
const { AutoLayout, SVG, Text, useSyncedState, usePropertyMenu } = widget;

function Widget() {
	const handleTextClick = () => {
		return new Promise(() => {
			figma.showUI(__html__, {
				width: 300,
				height: 260,
				themeColors: true,
			});
		});
	};

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
			onClick={handleTextClick}
		>
			<Text
				name="Click me"
				fill="#FFF"
				horizontalAlignText="center"
				fontFamily="Inter"
				fontSize={32}
				fontWeight={500}
			>
				Click me
			</Text>
		</AutoLayout>
	);
}

export default function () {
	widget.register(Widget);
}
