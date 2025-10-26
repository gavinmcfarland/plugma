import { mount } from 'svelte'
import './styles.css'
import App from './App.svelte'

// Log environment variables to test the fix
console.log('PROD', import.meta.env.PROD)
console.log('DEV', import.meta.env.DEV)
console.log('MODE', import.meta.env.MODE)

const app = mount(App, {
	target: document.getElementById('app')!,
})

export default app
