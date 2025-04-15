//@index('./**/types.ts', f => `export * from '${f.path}.js';`)
export * from './task-runner/types.js'
import type { PackageJson } from 'type-fest'
//@endindex

import type { UserConfig } from 'vite'

export type PlugmaCommand = 'preview' | 'dev' | 'build' | 'test'

/**
 * Plugin options for configuring the build process
 */
export interface PluginOptions {
	mode: string
	port: number
	output: string
	command?: PlugmaCommand
	instanceId: string
	debug?: boolean
	watch?: boolean
	manifest?: ManifestFile
	/** The working directory for the plugin */
	cwd?: string
	[key: string]: unknown
}

export type PlugmaRuntimeData = PluginOptions

/**
 * Manifest file structure for Figma plugins
 */
export interface ManifestFile {
	name: string
	version: string
	main: string
	ui?: string
	api: string
	networkAccess?: {
		devAllowedDomains?: string[]
		allowedDomains?: string[]
	}
	[key: string]: unknown
}

export type PlugmaPackageJson = typeof import('../../package.json')
export type UserPackageJson = PackageJson & {
	plugma?: {
		manifest?: ManifestFile
	}
}

/**
 * User files configuration
 */
export interface UserFiles {
	manifest: ManifestFile
	userPkgJson: UserPackageJson
}

export interface ViteConfigs {
	vite: {
		dev: UserConfig
		build: UserConfig
	}
	viteMain: {
		dev: UserConfig
		build: UserConfig
	}
}
