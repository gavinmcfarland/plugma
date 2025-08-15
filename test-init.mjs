import { Select, Input, Confirm } from 'enquirer';
import chalk from 'chalk';

// Test the enquirer wrapper functions from init.ts
async function select(options) {
    const prompt = new Select({
        name: 'value',
        message: options.message,
        choices: options.options.map(opt => ({
            name: opt.value,
            message: opt.label,
            hint: opt.hint
        }))
    });

    try {
        return await prompt.run();
    } catch (error) {
        throw new Error('User cancelled');
    }
}

async function text(options) {
    const prompt = new Input({
        name: 'value',
        message: options.message,
        initial: options.defaultValue,
        validate: options.validate ? (value) => {
            const result = options.validate(value);
            return result === undefined ? true : result;
        } : undefined
    });

    try {
        return await prompt.run();
    } catch (error) {
        throw new Error('User cancelled');
    }
}

async function confirm(options) {
    const prompt = new Confirm({
        name: 'value',
        message: options.message,
        initial: options.initialValue
    });

    try {
        return await prompt.run();
    } catch (error) {
        throw new Error('User cancelled');
    }
}

// Test the prompts
async function testPrompts() {
    console.log(chalk.blue.bold('Testing Enquirer Prompts'));
    console.log('');

    try {
        // Test select
        const type = await select({
            message: 'What type of project do you want to create?',
            options: [
                {
                    label: chalk.blue('Plugin'),
                    value: 'plugin',
                    hint: 'Extends Figma with custom functionality'
                },
                {
                    label: chalk.green('Widget'),
                    value: 'widget',
                    hint: 'Interactive components for Figma files'
                }
            ]
        });

        console.log(`Selected type: ${type}`);

        // Test confirm
        const typescript = await confirm({
            message: 'Use TypeScript?',
            initialValue: true
        });

        console.log(`Use TypeScript: ${typescript}`);

        // Test text input
        const projectName = await text({
            message: 'Project name:',
            defaultValue: 'my-project',
            validate: (value) => {
                if (!value.trim()) {
                    return 'Project name is required';
                }
                return undefined;
            }
        });

        console.log(`Project name: ${projectName}`);

        console.log(chalk.green('✅ All prompts worked successfully!'));

    } catch (error) {
        console.log(chalk.gray('Operation cancelled.'));
    }
}

testPrompts().catch(console.error);
