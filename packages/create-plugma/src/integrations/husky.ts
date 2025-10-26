import { defineIntegration } from './define-integration.js';
import dedent from 'dedent';
import { join } from 'node:path';

const baseDevDependencies = {
  husky: 'latest',
};

const lintStagedDevDeps = {
  'lint-staged': 'latest',
};

export default defineIntegration({
  id: 'husky',
  name: 'Husky',
  description: 'Git hooks (pre-commit, commit-msg, etc.)',
  requiresUI: false,

  questions: [
    {
      id: 'useLintStaged',
      type: 'confirm',
      question: 'Set up lint-staged to only run linters on changed files?',
      shortLabel: 'lint-staged',
      default: true,
    },
    {
      id: 'precommitChecks',
      type: 'multiselect',
      question: 'Which checks should run on pre-commit?',
      shortLabel: 'Pre-commit',
      options: [
        { value: 'lint', label: 'ESLint (npm run lint)' },
        { value: 'format', label: 'Prettier (npm run format)' },
        { value: 'typecheck', label: 'TypeScript (npm run typecheck)' },
        { value: 'unit', label: 'Unit tests (npm test / vitest)' },
        { value: 'e2e', label: 'E2E tests (Playwright)' },
      ],
      default: ['lint', 'format'],
    },
  ],

  devDependencies: baseDevDependencies,

  setup: [
    {
      label: 'Adding devDependencies to package.json',
      action: async ({ answers, helpers }) => {
        await helpers.updateJson('package.json', (json) => {
          json.devDependencies = json.devDependencies || {};
          // husky
          Object.entries(baseDevDependencies).forEach(([name, version]) => {
            json.devDependencies[name] = version;
          });
          // lint-staged (optional)
          if (answers.useLintStaged) {
            Object.entries(lintStagedDevDeps).forEach(([name, version]) => {
              json.devDependencies[name] = version;
            });
          }

          // Ensure prepare script runs husky
          json.scripts = json.scripts || {};
          const existingPrepare = json.scripts.prepare || '';
          if (!existingPrepare.includes('husky')) {
            json.scripts.prepare = existingPrepare
              ? `${existingPrepare} && husky`
              : 'husky';
          }

          // Optional: add a default lint-staged config into package.json if chosen and absent
          if (answers.useLintStaged) {
            json['lint-staged'] = json['lint-staged'] || {
              '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
              '*.{css,scss,md,json}': ['prettier --write'],
            };
          }
        });
      },
    },
    {
      label: 'Creating Husky pre-commit hook',
      action: async ({ answers, helpers }) => {
        // Build the pre-commit command block
        const commands: string[] = [];

        if (answers.useLintStaged) {
          commands.push('npx --no-install lint-staged');
        } else {
          // Fallback to full-run scripts (only if present)
          if (answers.precommitChecks?.includes('lint')) {
            commands.push('npm run -s lint --if-present');
          }
          if (answers.precommitChecks?.includes('format')) {
            commands.push('npm run -s format --if-present');
          }
          if (answers.precommitChecks?.includes('typecheck')) {
            commands.push('npm run -s typecheck --if-present');
          }
          if (answers.precommitChecks?.includes('unit')) {
            // Prefer vitest if present; otherwise npm test
            commands.push(
              // Try vitest first; if not installed, fallback to npm test
              'node -e "try{require.resolve(\'vitest\');process.exit(0)}catch{process.exit(1)}" && npx --no-install vitest run --silent || npm test --silent --if-present'
            );
          }
          if (answers.precommitChecks?.includes('e2e')) {
            // Run Playwright tests if installed
            commands.push(
              'node -e "try{require.resolve(\'@playwright/test\');process.exit(0)}catch{process.exit(1)}" && npx --no-install playwright test --reporter=list || true'
            );
          }
        }

        const hook = dedent`
          #!/usr/bin/env sh
          . "$(dirname -- "$0")/_/husky.sh"

          ${commands.join('\n')}
        `;

        // Write the pre-commit file into .husky/
        await helpers.ensureDir('.husky');
        await helpers.writeFile(join('.husky', 'pre-commit'), hook, { mode: 0o755 });
      },
    },
    {
      label: 'Optionally add commit-msg hook for commit linting',
      optional: true,
      action: async ({ helpers }) => {
        // If the project later installs @commitlint/cli, this hook will just work.
        const commitMsgHook = dedent`
          #!/usr/bin/env sh
          . "$(dirname -- "$0")/_/husky.sh"

          if command -v npx >/dev/null 2>&1; then
            npx --no-install commitlint --edit "$1" || true
          fi
        `;
        await helpers.ensureDir('.husky');
        await helpers.writeFile(join('.husky', 'commit-msg'), commitMsgHook, { mode: 0o755 });
      },
    },
  ],

  nextSteps: () => `
**Husky is wired up!**

1. Run \`npm install\` (if you haven't already).
2. Initialize hooks by running \`npm run prepare\` (this ensures Husky's internal setup is in place).
3. Pre-commit will now run your selected checks${' '}— customize scripts in \`package.json\` as needed.
4. If you enabled lint-staged, edit its config in \`package.json -> "lint-staged"\` (or move it to a dedicated config file later).
5. (Optional) Install \`@commitlint/cli @commitlint/config-conventional\` and add a \`commitlint.config.cjs\` to enforce commit messages.
`,
});
              
