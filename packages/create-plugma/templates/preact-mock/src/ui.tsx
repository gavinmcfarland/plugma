import { render } from 'preact'
import { App } from './ui.tsx'
import './styles.css'
import { compile } from 'svelte/compiler';

render(<App />, document.getElementById('app')!)
