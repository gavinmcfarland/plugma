// integrations/posthog.ts
import { defineIntegration } from './define-integration.js';
import dedent from 'dedent';
import { join, dirname, resolve } from 'node:path';
import { getUserFiles } from '../shared/index.js';

const runtimeDependencies = {
  'posthog-js': 'latest',
};

export default defineIntegration({
  id: 'posthog',
  name: 'PostHog',
  description: 'Lightweight analytics for Figma plugins (main + UI)',
  requiresUI: true,

  questions: [
    {
      id: 'apiKey',
      type: 'input',
      question: 'PostHog Project API Key:',
      shortLabel: 'API key',
      required: true,
    },
    {
      id: 'region',
      type: 'select',
      question: 'Data region:',
      shortLabel: 'Region',
      options: [
        { value: 'us', label: 'US (https://us.i.posthog.com)' },
        { value: 'eu', label: 'EU (https://eu.i.posthog.com)' },
        { value: 'custom', label: 'Custom host (self-hosted)' },
      ],
      default: 'us',
    },
    {
      id: 'customHost',
      type: 'input',
      question: 'Custom PostHog host (e.g. https://posthog.example.com)',
      shortLabel: 'Host',
      when: (answers) => answers.region === 'custom',
      required: true,
    },
    {
      id: 'anonymous',
      type: 'confirm',
      question: 'Send anonymous events (avoid creating/updating person profiles)?',
      shortLabel: 'Anonymous',
      default: true,
    },
  ],

  setup: [
    {
      label: 'Adding posthog-js to dependencies',
      action: async ({ helpers }) => {
        await helpers.updateJson('package.json', (json) => {
          json.dependencies = json.dependencies || {};
          Object.entries(runtimeDependencies).forEach(([name, version]) => {
            json.dependencies[name] = version;
          });
        });
      },
    },
    {
      label: 'Creating analytics helpers (main + UI)',
      action: async ({ answers, helpers }) => {
        const cwd = process.cwd();

        // Try to locate the UI directory from manifest; fallback to 'src'
        let uiDir = 'src';
        try {
          const files = await getUserFiles({ cwd });
          if (files.manifest?.ui) {
            uiDir = dirname(files.manifest.ui);
          }
        } catch {
          // ignore, default to src
        }

        const baseUrl =
          answers.region === 'eu'
            ? 'https://eu.i.posthog.com'
            : answers.region === 'us'
            ? 'https://us.i.posthog.com'
            : (answers.customHost as string).replace(/\/$/, '');

        // --- main thread helper (uses Figma fetch) ---
        const mainHelper = dedent`
          // src/analytics/posthog-main.ts
          // Minimal PostHog capture from the plugin main thread (Figma's global fetch)
          type PHConfig = {
            apiKey: string;
            baseUrl: string; // e.g. https://us.i.posthog.com or self-hosted
            anonymous?: boolean;
            defaultProps?: Record<string, any>;
          };

          let __cfg: PHConfig | null = null;

          export function initPosthogMain(cfg: PHConfig) {
            __cfg = { ...cfg };
          }

          type CaptureArgs = {
            event: string;
            distinctId: string;
            properties?: Record<string, any>;
            timestamp?: string; // ISO 8601 string
          };

          export async function captureMain(args: CaptureArgs) {
            if (!__cfg) return;
            const body = {
              api_key: __cfg.apiKey,
              event: args.event,
              distinct_id: args.distinctId,
              properties: {
                ...(__cfg.anonymous ? { $process_person_profile: false } : {}),
                ...(__cfg.defaultProps || {}),
                ...(args.properties || {}),
              },
              ...(args.timestamp ? { timestamp: args.timestamp } : {}),
            };

            try {
              const res = await fetch(\`\${__cfg.baseUrl}/i/v0/e/\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              return res.ok;
            } catch {
              return false;
            }
          }
        `;

        // --- UI helper (uses posthog-js) ---
        const uiHelper = dedent`
          // ${uiDir}/analytics/posthog-ui.ts
          import posthog from 'posthog-js';

          type UIConfig = {
            apiKey: string;
            baseUrl: string; // e.g. https://us.i.posthog.com or self-hosted
            anonymous?: boolean;
            defaultProps?: Record<string, any>;
          };

          let __init = false;

          export function initPosthogUI(cfg: UIConfig) {
            if (__init) return;
            posthog.init(cfg.apiKey, {
              api_host: cfg.baseUrl,
              autocapture: false,
              disable_session_recording: true,
            });
            __init = true;

            // Optional default properties
            if (cfg.defaultProps && Object.keys(cfg.defaultProps).length) {
              posthog.register(cfg.defaultProps);
            }

            // Anonymous mode: avoid person profile updates by tagging events
            if (cfg.anonymous) {
              posthog.register({ $process_person_profile: false });
            }
          }

          export function captureUI(event: string, properties?: Record<string, any>) {
            if (!__init) return;
            posthog.capture(event, properties);
          }

          export function optOutUI() {
            if (!__init) return;
            posthog.opt_out_capturing();
          }

          export function optInUI() {
            if (!__init) return;
            posthog.opt_in_capturing();
          }
        `;

        await helpers.ensureDir('src/analytics');
        await helpers.writeFile(join('src', 'analytics', 'posthog-main.ts'), mainHelper);

        // Ensure UI analytics subfolder exists within the detected UI dir
        await helpers.ensureDir(resolve(cwd, uiDir, 'analytics'));
        await helpers.writeFile(join(uiDir, 'analytics', 'posthog-ui.ts'), uiHelper);
      },
    },
  ],

  nextSteps: (answers) => dedent`
    **PostHog is set up (main + UI)!**

    ### Main thread
    Add this to \`code.ts\` (or your main entry):
    \`\`\`ts
    import { initPosthogMain, captureMain } from './analytics/posthog-main';

    initPosthogMain({
      apiKey: '${answers.apiKey}',
      baseUrl: '${answers.region === 'custom' ? answers.customHost : answers.region === 'eu' ? 'https://eu.i.posthog.com' : 'https://us.i.posthog.com'}',
      anonymous: ${answers.anonymous ? 'true' : 'false'},
      defaultProps: { $lib: 'figma-plugin', plugin_version: '0.1.0' },
    });

    figma.on('run', () => {
      const id = figma.currentUser?.id ?? 'anon';
      captureMain({
        event: 'plugin_opened',
        distinctId: id,
        properties: { editorType: figma.editorType, fileKey: figma.fileKey },
      });
    });
    \`\`\`

    ### UI thread
    Initialize once in your UI bootstrap (e.g., Svelte/React entry):
    \`\`\`ts
    import { initPosthogUI, captureUI } from '@/analytics/posthog-ui';

    initPosthogUI({
      apiKey: '${answers.apiKey}',
      baseUrl: '${answers.region === 'custom' ? answers.customHost : answers.region === 'eu' ? 'https://eu.i.posthog.com' : 'https://us.i.posthog.com'}',
      anonymous: ${answers.anonymous ? 'true' : 'false'},
      defaultProps: { ui: true },
    });

    // Example UI event
    captureUI('clicked_generate', { feature: 'example' });
    \`\`\`

    You can now capture **from both** the main thread (no UI needed) and the UI.
    Customize defaults in \`src/analytics/posthog-main.ts\` and \`${answers.uiDir ?? 'src'}/analytics/posthog-ui.ts\`.
  `,
});
