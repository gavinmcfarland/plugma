import React, { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import Icon from './components/Icon';
import Input from './components/Input';
import Button from './components/Button';

const App: React.FC = () => {
	const [rectCount, setRectCount] = useState<number>(5);
	const [nodeCount, setNodeCount] = useState<number>(0);

	const styles = {
		container: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%',
			width: '100%',
			flexDirection: 'column' as const,
		},
		banner: {
			display: 'flex',
			alignItems: 'center',
			gap: '18px',
			marginBottom: '16px',
		},
		nodeCount: {
			fontSize: '11px',
		},
		field: {
			display: 'flex',
			gap: 'var(--spacer-2)',
			height: 'var(--spacer-5)',
			alignItems: 'center',
		},
		createRectanglesInput: {
			width: '40px',
		},
	};

	const createRectangles = (count: number) => {
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'CREATE_RECTANGLES',
					count,
				},
			},
			'*',
		);
	};

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data.pluginMessage;
			if (message?.type === 'POST_NODE_COUNT') {
				setNodeCount(message.count);
			}
		};

		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, []);

	return (
		<div style={styles.container}>
			<div style={styles.banner}>
				<Icon svg="plugma" size={38} />
				<Icon svg="plus" size={24} />
				<img src={reactLogo} width="44" height="44" alt="Svelte logo" />
			</div>

			<div style={styles.field}>
				<Input
					type="number"
					value={rectCount.toString()}
					onChange={(value: string) => setRectCount(Number(value))}
					style={styles.createRectanglesInput}
				/>
				<Button onClick={() => createRectangles(rectCount)} href={undefined} target={undefined}>
					Create Rectangles
				</Button>
			</div>
			<div style={{ ...styles.nodeCount, ...styles.field }}>
				<span>{nodeCount} nodes selected</span>
			</div>
		</div>
	);
};

export default App;
