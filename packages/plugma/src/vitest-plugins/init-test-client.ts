import type { Vite, VitestPluginContext } from 'vitest/node'
import { createClient } from '../core/websockets/client.js'

console.log('[plugin] running plugin...')

// const port = process.env.PORT ? Number(process.env.PORT) + 1 : 3000

// const socket = createClient({
// 	room: 'test',
// 	url: 'ws://localhost',
// 	port,
// })

// socket.on('connect', () => {
// 	console.log('[socket] connected:', socket.id)
// })

// await new Promise<void>((resolve) => {
// 	socket.on('connect', () => {
// 		console.log('[socket] connected:', socket.id)
// 		resolve()
// 	})
// })

export default function initTestClient(): Vite.Plugin {
	return {
		name: 'vitest-socket-plugin',

		configureVitest(context: VitestPluginContext) {
			console.log('[plugin] configuring vitest', context.vitest)
		},
	}
}
