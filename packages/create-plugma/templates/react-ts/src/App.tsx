import React, { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import Icon from './components/Icon'
import Input from './components/Input'
import Button from './components/Button'
import './App.css' // Import CSS for styles

const App: React.FC = () => {
	const [rectCount, setRectCount] = useState<number>(5)
	const [nodeCount, setNodeCount] = useState<number>(0)

	const createRectangles = (count: number) => {
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
		const handleMessage = (event: MessageEvent) => {
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
		<div className="container">
			<div className="banner">
				<Icon svg="plugma" size={38} />
				<Icon svg="plus" size={24} />
				<img src={reactLogo} width="44" height="44" alt="Svelte logo" />
			</div>

			<div className="field create-rectangles">
				<Input
					type="number"
					value={rectCount}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRectCount(Number(e.target.value))}
				/>
				<Button onClick={() => createRectangles(rectCount)}>Create Rectangles</Button>
			</div>
			<div className="field node-count">
				<span>{nodeCount} nodes selected</span>
			</div>
		</div>
	)
}

export default App
