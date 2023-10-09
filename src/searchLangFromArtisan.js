const vscode = require('vscode');
const { spawn } = require('child_process');

module.exports = async function searchLangFromArtisan() {
    vscode.window.showInformationMessage('Je lance la recherche des langues et la maj du tree lang view');
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const command = 'php';
    const args = ['artisan', 'waka:tradauto', 'show', 'all'];
    const getProcess = spawn(command, args, { cwd: rootPath });

    let stdout = '';
    getProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    getProcess.stdout.on('close', () => {
        try {
            const parsedData = JSON.parse(stdout);
            console.log()
            // Mettez à jour la vue d'arbre avec les nouvelles données
            vscode.commands.executeCommand('vs-winter-lang-tools.updateTreeView', parsedData);
            vscode.window.showInformationMessage('MAJ du Lang des plugins : OK');
        } catch (e) {
            console.log('Erreur lors de la conversion de la sortie en JSON:', e);
        }
    });
    
};