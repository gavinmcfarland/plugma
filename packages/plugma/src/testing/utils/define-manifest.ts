interface Manifest {
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

interface NetworkAccess {
	allowedDomains: string[]
	reasoning?: string
	devAllowedDomains?: string[]
}

interface Parameter {
	name: string
	key: string
	description?: string
	allowFreeform?: boolean
	optional?: boolean
}

type ManifestMenuItem =
	| { name: string; command: string; parameters?: Parameter[]; parameterOnly?: boolean }
	| { separator: true }
	| { name: string; menu: ManifestMenuItem[] }

interface ManifestRelaunchButton {
	command: string
	name: string
	multipleSelection?: boolean
}

type PluginPermissionType = 'currentuser' | 'activeusers' | 'fileusers' | 'payments' | 'teamlibrary'

interface CodeLanguage {
	label: string
	value: string
}

interface CodegenPreference {
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
