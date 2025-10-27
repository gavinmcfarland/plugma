/**
 * Figma plugin manifest structure
 *
 * @see https://www.figma.com/plugin-docs/manifest/
 *
 * Note: @figma/plugin-typings does not include manifest type definitions,
 * so we maintain them here based on the official Figma documentation.
 */
export interface Manifest {
	name: string
	id?: string
	api: string
	main: string
	ui?: string | Record<string, string>
	documentAccess?: 'dynamic-page'
	networkAccess?: NetworkAccess
	parameters?: Parameter[]
	parameterOnly?: boolean
	editorType: ('figma' | 'figjam' | 'dev')[]
	menu?: ManifestMenuItem[]
	relaunchButtons?: ManifestRelaunchButton[]
	enableProposedApi?: boolean
	enablePrivatePluginApi?: boolean
	build?: string
	permissions?: PluginPermissionType[]
	capabilities?: ('textreview' | 'codegen' | 'inspect' | 'vscode')[]
	codegenLanguages?: CodeLanguage[]
	codegenPreferences?: CodegenPreference[]
}

export interface NetworkAccess {
	allowedDomains: string[]
	reasoning?: string
	devAllowedDomains?: string[]
}

export interface Parameter {
	name: string
	key: string
	description?: string
	allowFreeform?: boolean
	optional?: boolean
}

export type ManifestMenuItem =
	| { name: string; command: string; parameters?: Parameter[]; parameterOnly?: boolean }
	| { separator: true }
	| { name: string; menu: ManifestMenuItem[] }

export interface ManifestRelaunchButton {
	command: string
	name: string
	multipleSelection?: boolean
}

export type PluginPermissionType = 'currentuser' | 'activeusers' | 'fileusers' | 'payments' | 'teamlibrary'

export interface CodeLanguage {
	label: string
	value: string
}

export interface CodegenPreference {
	itemType: 'unit' | 'select' | 'action'
	propertyName: string
	label: string
	scaledUnit?: string
	defaultScaleFactor?: number
	default?: boolean
	options?: Array<{ label: string; value: string; isDefault?: boolean }>
	includedLanguages?: string[]
}

export function defineManifest(config: Manifest | (() => Manifest)): Manifest {
	if (typeof config === 'function') {
		return config()
	}
	return config
}

// Type alias for backward compatibility and cleaner type usage
export type PluginManifest = Manifest
