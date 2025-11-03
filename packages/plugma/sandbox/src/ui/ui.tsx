import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.tsx';

createRoot(document.getElementById('app')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
