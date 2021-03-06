'use strict';

var name = "plugma-rollup";
var version = "2.0.21";
var description = "Your Figma plugin";
var main = "code.ts";
var scripts = {
	webpack: "webpack",
	build: "rollup -c && plugma version -i",
	dev: "rollup -c -w"
};
var author = "";
var license = "";
var devDependencies = {
	"@figma/plugin-typings": "^1.19.2",
	"@rollup/plugin-commonjs": "^17.1.0",
	"@rollup/plugin-dynamic-import-vars": "^1.1.1",
	"@rollup/plugin-replace": "^2.4.1",
	"@rollup/plugin-typescript": "^8.2.0",
	"@types/node": "^14.14.35",
	plugma: "0.0.0-alpha0.1",
	rollup: "^2.41.5",
	"rollup-plugin-execute": "git+https://github.com/GerkinDev/rollup-plugin-execute.git",
	"rollup-plugin-inject-process-env": "^1.3.1",
	"rollup-plugin-node-globals": "^1.4.0",
	"rollup-plugin-node-polyfills": "^0.2.1",
	"rollup-plugin-terser": "^7.0.2",
	typescript: "^4.2.3",
	yargs: "^16.2.0"
};
var dependencies = {
	browserify: "^17.0.0"
};
var require$$0 = {
	name: name,
	version: version,
	description: description,
	main: main,
	scripts: scripts,
	author: author,
	license: license,
	devDependencies: devDependencies,
	dependencies: dependencies
};

// TODO: Check package from working directory
// TODO: Check versions from working directory
// TODO: How to fix issue of referenceing file when used as depency
// import pkg from '../package.json';
// import versionHistory from './versions.json';
// import semver from 'semver';
// import fs from 'fs';
// import path from 'path';
var pkg;

{
    pkg = require$$0;
}
// try {
// 	versionHistory = require("./package.json");
// }
// catch {
// 	versionHistory = {}
// }
// pkg = require(process.cwd() + "/package.json");
// }
// console.log(process.cwd() + "/package.json");
// fs.readFile("../package.json", (err, data) => {
// 	console.log(err, data)
// })
// const file = require("package.json")
// console.log(file)
// function updateAvailable() {
// 	var currentVersion = figma.root.getPluginData("pluginVersion") || pkg.version;
// 	var newVersion = pkg.version;
// 	if (semver.gt(newVersion, currentVersion)) {
// 		return true
// 	}
// 	else {
// 		false
// 	}
// }
function plugma(plugin) {
    var pluginState = {
        updateAvailable: false,
        ui: {}
    };
    // console.log(pkg)
    if (pkg === null || pkg === void 0 ? void 0 : pkg.version) {
        pluginState.version = pkg.version;
    }
    // pluginState.updateAvailable = updateAvailable()
    var eventListeners = [];
    var menuCommands = [];
    pluginState.on = (type, callback) => {
        eventListeners.push({ type, callback });
    };
    pluginState.command = (type, callback) => {
        menuCommands.push({ type, callback });
    };
    // Override default page name if set
    var pageMannuallySet = false;
    pluginState.setStartPage = (name) => {
        pluginState.ui.page = name;
        pageMannuallySet = true;
    };
    // pluginState.update = (callback) => {
    // 	for (let [version, changes] of Object.entries(versionHistory)) {
    // 		if (version === pkg.version) {
    // 			// for (let i = 0; i < changes.length; i++) {
    // 			// 	var change = changes[i]
    // 			// }
    // 			callback({ version, changes })
    // 		}
    // 	}
    // }
    var pluginCommands = plugin(pluginState);
    // // Override default page name if set
    // if (pageName[0]) {
    // 	pluginState.ui.page = pageName[0]
    // }
    // console.log("pageName", pluginState.ui.page)
    Object.assign({}, pluginState, { commands: pluginCommands });
    if (pluginCommands) {
        for (let [key, value] of Object.entries(pluginCommands)) {
            // If command exists in manifest
            if (figma.command === key) {
                // Pass default page for ui
                if (!pageMannuallySet) {
                    pluginState.ui.page = key;
                }
                // Override default page name if set
                // if (pageName[0]) {
                // 	pluginState.ui.page = pageName[0]
                // }
                // Call function for that command
                value(pluginState);
                // Show UI?
                if (pluginState.ui.open) {
                    console.log("open?");
                    figma.showUI(pluginState.ui.html);
                }
            }
        }
    }
    figma.ui.onmessage = message => {
        for (let eventListener of eventListeners) {
            // console.log(message)
            if (message.type === eventListener.type)
                eventListener.callback(message);
        }
    };
    pluginState.ui.show = (data) => {
        figma.showUI(pluginState.ui.html, { width: pluginState.ui.width, height: pluginState.ui.height });
        figma.ui.postMessage(data);
    };
    for (let command of menuCommands) {
        if (figma.command === command.type) {
            command.callback(pluginState);
        }
    }
    // console.log(pluginObject)
}

var dist = plugma;

dist((plugin) => {
    console.log(plugin);
    plugin.ui = {
        html: __html__,
        width: 250,
        height: 300
    };
    plugin.command('createRectangles', ({ ui, data }) => {
        ui.show(data);
        plugin.on('create-rectangles', (msg) => {
            figma.clientStorage.getAsync('what').then((res) => {
                console.log("success2");
            }).catch((res) => {
                console.log("failing2");
            });
            const nodes = [];
            for (let i = 0; i < msg.count; i++) {
                const rect = figma.createRectangle();
                const rect2 = figma.createRectangle();
                console.log(rect2);
                rect.x = i * 150;
                rect.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
                figma.currentPage.appendChild(rect);
                nodes.push(rect);
            }
            figma.currentPage.selection = nodes;
            figma.viewport.scrollAndZoomIntoView(nodes);
            figma.closePlugin();
        });
        plugin.on('cancel', () => {
            figma.clientStorage.getAsync('what').then((res) => {
                console.log("success");
            }).catch((res) => {
                console.log("failing");
            });
            figma.closePlugin();
        });
    });
});
