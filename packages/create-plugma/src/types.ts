//@index('./**/types.ts', f => `export * from '${f.path}.js';`)
import type { PackageJson } from 'type-fest';
import type { BaseOptions } from './shared/index.js';
//@endindex

export type PlugmaCommand = 'build' | 'dev' | 'test' | 'preview';

// TODO: Remove eventually
export type PluginOptions = BaseOptions;

export interface UserPluginOptions {
	mode?: string;
	port?: number;
	output?: string;
	debug?: boolean;
	watch?: boolean;
	cwd: string;
}

export type PlugmaRuntimeData = PluginOptions;

/**
 * Manifest file structure for Figma plugins
 */
export interface ManifestFile {
	name: string;
	version: string;
	main: string;
	ui?: string;
	api: string;
	networkAccess?: {
		devAllowedDomains?: string[];
		allowedDomains?: string[];
	};
	[key: string]: unknown;
}

export type PlugmaPackageJson = typeof import('../package.json');
export type UserPackageJson = PackageJson & {
	plugma?: {
		manifest?: ManifestFile;
	};
};

/**
 * User files configuration
 */
export interface UserFiles {
	manifest: ManifestFile;
	userPkgJson: UserPackageJson;
	rawManifest: ManifestFile;
}
