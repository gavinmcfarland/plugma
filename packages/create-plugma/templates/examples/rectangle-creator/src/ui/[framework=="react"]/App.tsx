import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import Icon from './components/Icon'
import Input from './components/Input'
import Button from './components/Button'

const App = () => {
	const [rectCount, setRectCount] = useState<%= typescript ? "<number>" : "" %>(5)
	const [nodeCount, setNodeCount] = useState<%= typescript ? "<number>" : "" %>(0)

	const styles = {
		container: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			height: '100%',
			width: '100%',
			flexDirection: 'column',
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
	}

	const createRectangles = (count) => {
		window.parent.postMessage(
			{
				pluginMessage: {
					type: 'CREATE_RECTANGLES',
					count,
				},
			},
			'*',
		)
	}

	useEffect(() => {
		const handleMessage = (event) => {
			const message = event.data.pluginMessage
			if (message?.type === 'POST_NODE_COUNT') {
				setNodeCount(message.count)
			}
		}

		window.addEventListener('message', handleMessage)
		return () => {
			window.removeEventListener('message', handleMessage)
		}
	}, [])

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
					value={rectCount}
					onChange={(e) => setRectCount(Number(e.target.value))}
					style={styles.createRectanglesInput}
				/>
				<Button onClick={() => createRectangles(rectCount)}>Create Rectangles</Button>
			</div>
			<div style={styles.nodeCount}>
				<span>{nodeCount} nodes selected</span>
			</div>
		</div>
	)
}

export default App