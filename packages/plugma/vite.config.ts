export default {
	build: {
		lib: {
			entry: 'src/bin/cli.ts',
			name: 'Plugma',
			fileName: (format) => `plugma.${format}.js`,
			formats: ['es']
		}
	},
	external: ['@clack/prompts', 'commander', 'socket.io', 'socket.io-client'],
  }