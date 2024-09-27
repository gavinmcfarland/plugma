import chalk from 'chalk';

class Log {
	static log(message, indentLevel = 0, type) {
		const indent = ' '.repeat(indentLevel * 2); // 2 spaces per indent level

		const prefix = this.getPrefix(type);
		const formattedMessage = `${indent}${prefix}${message}`;

		console.log(formattedMessage);
	}

	static getPrefix(type) {
		switch (type) {
			case 'info ':
				return chalk.blue.bold('INFO: ');
			case 'success':
				return chalk.green.bold('SUCCESS: ');
			case 'error':
				return chalk.red.bold('ERROR: ');
			case 'warning':
				return chalk.yellow.bold('WARNING: ');
			default:
				return "";
		}
	}

	static text(message, indentLevel = 0) {
		this.log(message, indentLevel);
	}

	static info(message, indentLevel = 0) {
		this.log(message, indentLevel, 'info',);
	}

	static success(message, indentLevel = 0) {
		this.log(message, indentLevel, 'success');
	}

	static error(message, indentLevel = 0) {
		this.log(message, indentLevel, 'error');
	}

	static warning(message, indentLevel = 0) {
		this.log(message, indentLevel, 'warning');
	}
}

export { Log };
