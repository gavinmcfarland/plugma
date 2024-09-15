import nunjucks from 'nunjucks';

// Define the custom filter to escape closing tags
function initializeNunjucksEnv(basePath) {
	const env = nunjucks.configure(basePath, {
		autoescape: true,
		watch: false, // Optional: set to true if you want to watch for changes in templates
	});

	// Define custom filters
	env.addFilter('toUpperCase', function (value) {
		return value.toUpperCase();
	});

	env.addFilter('truncate', function (value, length) {
		return value.length > length ? value.substring(0, length) + '...' : value;
	});

	// Define the escapeClosingTags filter
	env.addFilter('escapeClosingTags', function (value) {

		console.log("------ value", value)
		// Replace closing tags with an escaped version
		return value.replace(/<\/(script|iframe|div|p|span|a|html|body|head|style|meta)>/g, '\\x3C/$1>');
	});

	return env;
}

// Main function to render the template
export function renderTemplate(basePath, entryFile, templateData) {
	// Initialize Nunjucks with the specified base path
	const env = initializeNunjucksEnv(basePath);

	// Render the template using Nunjucks with the provided templateData
	try {
		const result = env.render(entryFile, templateData);
		return result;
	} catch (err) {
		console.error(err);
		return null;
	}
}
