#!/usr/bin/env node

import { Combino } from 'combino';
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const CURR_DIR = process.cwd();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Test data
const testData = {
    name: 'test-project',
    type: 'plugin',
    language: 'typescript',
    framework: 'svelte',
    example: 'basic',
    typescript: true,
    description: 'A Figma plugin with Svelte and TypeScript'
};

// Define the output directory
const destDir = path.join(CURR_DIR, 'test-output');

// Clear directory if it exists
if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
    console.log(`Cleared existing directory: ${destDir}`);
}

// Prepare template paths
const templates = [];

// Add base template first (lowest priority)
templates.push(path.join(__dirname, 'templates', 'base'));

// Add framework-specific template
const frameworkTemplateDir = path.join(__dirname, 'templates', 'frameworks', testData.framework);
if (fs.existsSync(frameworkTemplateDir)) {
    templates.push(frameworkTemplateDir);
}

// Add example template (highest priority)
const exampleTemplateDir = path.join(__dirname, 'templates', 'examples', testData.type, testData.example);
if (fs.existsSync(exampleTemplateDir)) {
    templates.push(exampleTemplateDir);
}

console.log('Template paths:', templates);
console.log('Template data:', testData);

// Initialize Combino
const combino = new Combino();

try {
    // Generate the project using Combino
    await combino.combine({
        outputDir: destDir,
        include: templates,
        templateEngine: 'ejs',
        data: testData
    });

    console.log(`\n✅ Successfully created test project in ${destDir}`);
    console.log('\nGenerated files:');

    // List generated files
    const listFiles = (dir, prefix = '') => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                console.log(`${prefix}📁 ${file}/`);
                listFiles(fullPath, prefix + '  ');
            } else {
                console.log(`${prefix}📄 ${file}`);
            }
        });
    };

    listFiles(destDir);

} catch (error) {
    console.error('Error generating project:', error);
    process.exit(1);
}
