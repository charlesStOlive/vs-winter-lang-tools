const vscode = require('vscode');

class JsonTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, value, keyPath, contextValue, iconPath) {
        super(label, collapsibleState);
        this.value = value;
        this.keyPath = keyPath;
        this.contextValue = contextValue;
        this.iconPath = iconPath;
    }
}

class JsonTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.jsonData = {};
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return Object.keys(this.jsonData).map(
                key => {
                    const value = this.jsonData[key];
                    const hasError = this._checkForError(value);
                    const iconPath = hasError ? new vscode.ThemeIcon("error") : undefined;

                    return new JsonTreeItem(
                        this._buildLabel(key, value),
                        vscode.TreeItemCollapsibleState.Collapsed,
                        value,
                        key,
                        this._getCollapsibleState(value) === vscode.TreeItemCollapsibleState.None ? 'leafKey' : 'rootKey',
                        iconPath  // Assignation de l'icône ici aussi.
                    );
                }
            );
        } else {
            if (typeof element.value === 'object' && element.value !== null) {
                return Object.keys(element.value).map(
                    key => {
                        const value = element.value[key];
                        const hasError = this._checkForError(value);
                        const iconPath = hasError ? new vscode.ThemeIcon("error") : undefined;  // "error" est l'ID de l'icône que vous avez défini dans package.json

                        return new JsonTreeItem(
                            this._buildLabel(key, value),
                            this._getCollapsibleState(value),
                            value,
                            element.keyPath + '.' + key,
                            this._getCollapsibleState(value) === vscode.TreeItemCollapsibleState.None ? 'leafKey' : 'nestedKey',
                            iconPath
                        );
                    }
                );
            }
            return [];
        }
    }

    _checkForError(value) {
        if (typeof value === "string" && value.includes("Tr:")) {
            return true;
        }

        if (typeof value === "object") {
            for (let key in value) {
                if (this._checkForError(value[key])) {
                    return true;
                }
            }
        }

        return false;
    }

    _buildLabel(key, value) {
        if (typeof value === 'object' && value !== null) {
            return key;  // Return just the key for non-leaf nodes.
        } else {
            return `${key} = ${value}`;  // Return "key = value" for leaf nodes.
        }
    }


    _getCollapsibleState(value) {
        if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
            return vscode.TreeItemCollapsibleState.Collapsed;
        } else {
            return vscode.TreeItemCollapsibleState.None;
        }
    }
}

module.exports = JsonTreeProvider;
