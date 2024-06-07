import React from 'react'
import ReactDOM from 'react-dom/client'

export function mount(App) {
	ReactDOM.createRoot(document.getElementById('root')!).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	)
}
