/** @jsx figma.widget.h */

const { widget } = figma;
const { AutoLayout, SVG, Text, useSyncedState, usePropertyMenu } = widget;

const buttonSrc = `
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="15.5" stroke="black" stroke-opacity="0.1" fill="white"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M17 8H15V15H8V17H15V24H17V17H24V15H17V8Z" fill="black" fill-opacity="0.8"/>
  </svg>
`;

const downIconSrc = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.08 0.079998H9.08L9.08 12.08L14.58 6.58L16 8L8.08 15.92L0.160004 8L1.58 6.58L7.08 12.08L7.08 0.079998Z" fill="white"/>
  </svg>
`;

const upIconSrc = `
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9.08001 15.92L7.08001 15.92L7.08001 3.92002L1.58001 9.42002L0.160007 8.00002L8.08001 0.0800171L16 8.00002L14.58 9.42002L9.08001 3.92002L9.08001 15.92Z" fill="white"/>
  </svg>
`;

function Counter() {
	const [count, setCount] = useSyncedState('count', 0);
	const propertyMenu: WidgetPropertyMenuItem[] = [
		{
			tooltip: 'Increment',
			propertyName: 'increment',
			itemType: 'action',
			icon: upIconSrc,
		},
	];
	if (count > 0) {
		propertyMenu.push({
			tooltip: 'Decrement',
			propertyName: 'decrement',
			itemType: 'action',
			icon: downIconSrc,
		});
	}

	usePropertyMenu(propertyMenu, ({ propertyName }) => {
		if (propertyName === 'decrement') {
			setCount(count - 1);
		} else if (propertyName === 'increment') {
			setCount(count + 1);
		}
	});

	return (
		<AutoLayout
			verticalAlignItems="center"
			padding={{ left: 16, right: 8, top: 8, bottom: 8 }}
			fill="#FFFFFF"
			cornerRadius={8}
			spacing={12}
			stroke={{
				type: 'solid',
				color: '#123456',
			}}
			effect={{
				type: 'drop-shadow',
				color: { r: 0, g: 0, b: 0, a: 0.2 },
				offset: { x: 0, y: 0 },
				blur: 2,
				spread: 2,
			}}
		>
			<SVG
				src={buttonSrc}
				onClick={() => {
					setCount(count + 1);
				}}
			/>
			<AutoLayout
				verticalAlignItems="center"
				height="hug-contents"
				padding={{ left: 24, right: 24, top: 12, bottom: 12 }}
				fill="#E6E6E6"
				cornerRadius={8}
			>
				<Text fontSize={32} horizontalAlignText="center">
					{count}
				</Text>
			</AutoLayout>
		</AutoLayout>
	);
}

export default function () {
	widget.register(Counter);
}
