/** @jsx figma.widget.h */
/** @jsxFrag figma.widget.Fragment */

const { widget } = figma;
const { AutoLayout, Line, Text, useEffect, useSyncedState } = widget;

function Widget() {
	const [log, setLog] = useSyncedState<string[]>('log', []);

	function onClose() {
		setLog([]);
	}

	function documentChangeAsString(change: DocumentChange) {
		const { origin, type } = change;
		const list: string[] = [origin, type];
		if (type === 'PROPERTY_CHANGE') {
			list.push(change.node.type);
			list.push(change.properties.join(', '));
		} else if (type === 'STYLE_CHANGE') {
			list.push(change.style.name);
			list.push(change.properties.join(', '));
		} else {
			list.push(change.node.type);
		}
		return list.join(' ');
	}

	function onDocumentChange(event: DocumentChangeEvent) {
		const tmp: string[] = [...event.documentChanges.map(documentChangeAsString), ...log];
		tmp.splice(Math.min(50, tmp.length), tmp.length);
		setLog(tmp);
	}

	useEffect(() => {
		figma.on('close', onClose);
		figma.on('documentchange', onDocumentChange);
		return function cleanup() {
			figma.off('close', onClose);
			figma.off('documentchange', onDocumentChange);
		};
	});

	return (
		<AutoLayout
			direction="vertical"
			height="hug-contents"
			onClick={() =>
				new Promise(() => {
					figma.showUI('', { visible: false });
				})
			}
			width={400}
		>
			{(log.length ? log : ['CLICK TO START']).map((item, i) => (
				<figma.widget.Fragment key={item}>
					{i === 0 ? null : <Line length={400} stroke="#eee" />}
					<AutoLayout padding={12} fill="#FFFFFF" width={'fill-parent'}>
						<Text fontSize={12}>{item}</Text>
					</AutoLayout>
				</figma.widget.Fragment>
			))}
		</AutoLayout>
	);
}

export default function () {
	widget.register(Widget);
}
