/** @jsx figma.widget.h */

const { widget } = figma
const { AutoLayout, SVG, Text, useSyncedState, usePropertyMenu } = widget

function Widget() {
  return (
    <AutoLayout
      verticalAlignItems="center"
      padding={{ left: 16, right: 8, top: 8, bottom: 8 }}
      fill="#CCCCCC"
      cornerRadius={8}
      spacing={12}
    >
        <Text fontSize={32} horizontalAlignText="center">
          Hello World
        </Text>
    </AutoLayout>
  )
}

export default function () {
	widget.register(Widget);
}
