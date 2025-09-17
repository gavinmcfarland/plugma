/** @jsx figma.widget.h */

const { editorType, widget } = figma;
const { AutoLayout, Text, useStickable, useStickableHost, useSyncedState } = widget;

function Widget() {
	const [stickable, setStickable] = useSyncedState('stickable', true);
	// A widget can either be stickable or a stickable host at any given point in time, never both simultaneously.
	// We are using state to toggle the behavior for the widget.
	if (stickable) {
		useStickable(({ newHostId, oldHostId }) => {
			// https://www.figma.com/widget-docs/api/type-WidgetStuckEvent
			console.log({ newHostId, oldHostId });
		});
	} else {
		useStickableHost(({ stuckNodeIds, unstuckNodeIds }) => {
			// https://www.figma.com/widget-docs/api/type-WidgetAttachedStickablesChangedEvent
			console.log({ stuckNodeIds, unstuckNodeIds });
		});
	}
	const text =
		editorType === 'figma'
			? 'Stickables are not yet supported in Figma design'
			: stickable
				? 'Stick me to things'
				: 'Stick things to me';
	return (
		<AutoLayout
			fill={stickable ? '#000' : '#FFF'}
			hoverStyle={{ fill: stickable ? '#222' : '#EEE' }}
			onClick={() => setStickable(!stickable)}
			padding={stickable ? 32 : 128}
			stroke="#000"
			strokeWidth={2}
			tooltip="Click to toggle stickable/host"
		>
			<Text fill={stickable ? '#FFF' : '#000'} fontSize={32} hoverStyle={{ opacity: 0.8 }}>
				{text}
			</Text>
		</AutoLayout>
	);
}

export default function () {
	widget.register(Widget);
}
