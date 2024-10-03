import fs from 'fs';

const globalPolyfill = (options = {}) => {
	return {
		name: 'global-polyfill',
		setup(build) {
			build.onLoad({ filter: /\.js$/ }, async (args) => {
				const source = await fs.promises.readFile(args.path, 'utf8');

				const polyfill = `
				  // Detect the global object in various environments
				  const globalRef = typeof globalThis !== 'undefined' ? globalThis :
				                    typeof self !== 'undefined' ? self :
				                    typeof window !== 'undefined' ? window :
				                    typeof global !== 'undefined' ? global :
				                    { Object: Object };

				  // If global is undefined, define it globally
				  if (typeof global === 'undefined') {
				    var global = globalRef;
				  }

				  console.log("global is now defined globally:", global);
				`;

				return {
					contents: polyfill + source,  // Add the polyfill before the file contents
					loader: 'js',
				};
			});
		}
	}
};

export default globalPolyfill;
