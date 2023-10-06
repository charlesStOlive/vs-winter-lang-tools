const vscode = require('vscode');

class JsonTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, jsonContent) {
        super(label, collapsibleState);
        this.jsonContent = jsonContent;
    }
}

module.exports = JsonTreeItem;
