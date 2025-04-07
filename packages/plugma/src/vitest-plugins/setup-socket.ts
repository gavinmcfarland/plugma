import { createClient } from '../core/websockets/client'

const port = process.env.PORT ? Number(process.env.PORT) + 1 : 3000

const socket = createClient({
	room: 'test',
	url: 'ws://localhost',
	port,
})

// Wait for socket connection before proceeding
await new Promise<void>((resolve) => {
	socket.on('connect', () => {
		console.log('[socket] connected:', socket.id)
		resolve()
	})
})

// Save reference globally if needed
;(globalThis as any).__testSocket = socket

const originalTest = globalThis.test

declare global {
	var test: (name: string, fn: Function, timeout?: number) => void
}

console.log('[socket] patching test', globalThis.test)

globalThis.test = function patchedTest(name, fn, timeout) {
	console.log('[socket] test function called with name:', name)

	originalTest(
		name,
		async () => {
			console.log('[socket] test execution started')
			console.log('[socket] emitting test:start', { name })
			socket.emit('test:start', { name })

			try {
				await fn()
				console.log('[socket] test passed')
				socket.emit('test:end', { name, status: 'passed' })
			} catch (err) {
				console.log('[socket] test failed')
				socket.emit('test:end', {
					name,
					status: 'failed',
					error: err instanceof Error ? err.message : String(err),
				})
				throw err
			}
		},
		timeout,
	)
}
