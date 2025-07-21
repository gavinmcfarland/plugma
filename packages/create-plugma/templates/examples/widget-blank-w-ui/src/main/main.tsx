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
			verticalAlignItems="center"
			padding={{ left: 16, right: 8, top: 8, bottom: 8 }}
			fill="#CCCCCC"
			cornerRadius={8}
			spacing={12}
		>
			<Text
				fontSize={32}
				horizontalAlignText="center"
				onClick={handleTextClick}
				fill="#000000"
			>
				Hello World
			</Text>
		</AutoLayout>
	);
}

export default function () {
	widget.register(Widget);
}
