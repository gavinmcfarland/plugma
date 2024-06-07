import React from 'react'
import ReactDOM from 'react-dom/client'

export function mount(App) {
	ReactDOM.createRoot(document.getElementById('app')!).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	)
}
