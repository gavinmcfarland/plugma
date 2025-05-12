import type { ManifestFile } from '../../core/types.js'
import { BuildCommandOptions, DevCommandOptions, PreviewCommandOptions } from '../../utils/create-options.js'
import { getUserFiles } from '../../utils/get-user-files.js'
import { transformManifest } from '../../utils/transform-manifest.js'
import { join, resolve } from 'node:path'
import { access, mkdir, writeFile } from 'node:fs/promises'

export interface BuildManifestResult {
	raw: ManifestFile
	processed: ManifestFile
}

export async function validateManifest(manifest?: Partial<ManifestFile>) {
	if (!manifest) {
		throw new Error('No manifest found in manifest.json or package.json')
	}

	if (!manifest.main && !manifest.ui) {
		throw new Error('No main or UI file specified')
	}

	if (!manifest.name) {
		console.warn('Plugma: Please specify the name in the manifest. Example: `{ name: "My Plugin" }`')
	}
}

async function verifyManifestFile(manifestPath: string): Promise<void> {
	if (process.env.PLUGMA_DEBUG_TASK !== 'build:manifest') return

	try {
		const manifestExists = await access(manifestPath)
			.then(() => true)
			.catch(() => false)

		if (!manifestExists) {
			console.error('✗ manifest.json was not created at:', manifestPath)
		}
	} catch (err) {
		console.error('Error checking manifest file:', err)
	}
}

export async function buildManifestFile(
	options: DevCommandOptions | BuildCommandOptions | PreviewCommandOptions,
): Promise<{
	files: Awaited<ReturnType<typeof getUserFiles>>
	result: BuildManifestResult
}> {
	const files = await getUserFiles(options)
	await validateManifest(files.manifest)

	const outputDirPath = resolve(options.cwd || process.cwd(), options.output)
	const manifestPath = join(outputDirPath, 'manifest.json')

	//TODO: Does ensureDist need to be run here?
	await mkdir(outputDirPath, { recursive: true })

	const transformedManifest = await transformManifest(files.manifest, options)
	await writeFile(manifestPath, JSON.stringify(transformedManifest, null, 2))
	await verifyManifestFile(manifestPath)

	return {
		files,
		result: {
			raw: files.manifest,
			processed: transformedManifest,
		},
	}
}
