/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_TITLE: string
	readonly PROD: boolean
	readonly DEV: boolean
	readonly MODE: string
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
