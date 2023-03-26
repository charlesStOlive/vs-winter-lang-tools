const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class LangChecker {
	constructor() {
		this.jsonResult = {};
	}

	async analyzeAllDirectories() {
		const config = vscode.workspace.getConfiguration('vs-winter-lang-tools');
		const dirsToAnalyze = config.get('dirsToAnalyze');
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders) {
			console.error('No workspace folder is open.');
			return;
		}

		const rootPath = workspaceFolders[0].uri.fsPath;

		for (const dir of dirsToAnalyze) {
			const fullPath = path.join(rootPath, dir);
			await this.analyzeDirectoryRecursively(fullPath);
		}
		let php = this.jsonToPHP(this.jsonResult);
		console.log(php)
		let myjson = this.phpToJson(String(php));
		console.log(myjson)


	}

	async analyzeDirectoryRecursively(directoryPath) {
		const files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
		for (const file of files) {
			const filePath = path.join(directoryPath, file.name);

			if (file.isDirectory()) {
				await this.analyzeDirectoryRecursively(filePath);
			} else {
				await this.analyzeFile(filePath);
			}
		}
	}

	async analyzeFile(filePath) {
		console.log(filePath)
		const content = await fs.promises.readFile(filePath, 'utf-8');
		const lines = content.split(/\r?\n/);

		const pattern = /(?<!ew\(')(?<!al\(')(\w+\.\w+::\w+(\.\w+)+)/g;

		for (const line of lines) {
			let match;

			while ((match = pattern.exec(line)) !== null) {
				this.processMatch(match[1]);
			}
		}
	}

	processMatch(match) {
		const parts = match.split(/\.|::/);
		let currentObj = this.jsonResult;

		for (let i = 0; i < parts.length; i++) {
			const key = parts[i];

			if (!currentObj[key]) {
				if (i === parts.length - 1) {
					currentObj[key] = match; // Utilisez le groupe trouvé comme valeur
				} else {
					currentObj[key] = {};
				}
			}

			currentObj = currentObj[key];
		}
	}

	getJson() {
		return this.jsonResult;
	}

	jsonToPHP(json) {
		function processValue(value, level) {
			if (typeof value === 'object') {
				return objectToPHPArray(value, level + 1);
			}
			return typeof value === 'string' ? `'${value.replace(/'/g, "\\'")}'` : value;
		}

		function objectToPHPArray(obj, level) {
			const indent = '  '.repeat(level);
			const items = [];

			for (const key in obj) {
				const value = obj[key];
				items.push(`'${key}' => ${processValue(value, level)}`);
			}

			return `[\n${indent}${items.join(`,\n${indent}`)}\n${'  '.repeat(level - 1)}]`;
		}

		return `<?php\nreturn ${objectToPHPArray(json, 1)};`;
	}
	phpToJson(phpString) {
		const cleanedString = phpString.replace('<?php\nreturn', '').replace(';', '');
		const obj = eval(`(${cleanedString.replace(/=>/g, ':')})`);
		return JSON.stringify(obj, null, 2);
	}

}

module.exports = LangChecker;