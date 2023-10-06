const { spawn } = require('child_process');
const vscode = require('vscode');

function launchEdit(selectedText) {
const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder is open.');
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const command = 'php';
  const args = ['artisan', 'waka:tradauto', 'get', escapeShellArg(selectedText)];
  const getProcess = spawn(command, args, { cwd: rootPath });

  let stdout = '';
  getProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  getProcess.stderr.on('data', (data) => {
    vscode.window.showErrorMessage(`Error: ${data}`);
  });

  getProcess.on('close', async (code) => {
    if (code !== 0) {
      vscode.window.showErrorMessage(`Error: child process exited with code ${code}`);
      return;
    }

    let stdoutArray = {};
    try {
      stdoutArray = JSON.parse(stdout);
    } catch (errorJson) {
      vscode.window.showErrorMessage(`Error: ${errorJson.message}`);
    }

    if (stdoutArray.code === 'error_file') {
      const createFileChoice = await vscode.window.showQuickPick(['Créer le fichier', 'Annuler'], {
        title: 'Voulez-vous créer le fichier ?',
        ignoreFocusOut: true,
      });

      if (createFileChoice === 'Créer le fichier') {
        createAndInsertTranslation(selectedText, rootPath, command);
      } else {
        // Annuler ou fermer la boîte de dialogue
        return;
      }
    } else {
      const input = await vscode.window.showInputBox({
        prompt: 'Enter translated text:',
        value: stdoutArray.translation || '',
      });

      if (input === undefined) {
        return;
      }

      updateTranslation(selectedText, input, rootPath, command);
    }
  });
}
async function updateTranslation(selectedText, translatedText, rootPath, command = 'php') {
  const insertArgs = ['artisan', 'waka:tradauto', 'insert', escapeShellArg(selectedText), escapeShellArg(translatedText)];
    const insertProcess = spawn(command, insertArgs, { cwd: rootPath });

    let insertStdout = '';
    insertProcess.stdout.on('data', (data) => {
      insertStdout += data.toString();
    });

    insertProcess.stderr.on('data', (data) => {
      vscode.window.showErrorMessage(`Error: ${data}`);
    });

    insertProcess.on('close', (code) => {
      if (code !== 0) {
        vscode.window.showErrorMessage(`Error: child process exited with code ${code}`);
        return;
      }

      if (insertStdout.trim() === 'true') {
        const editor = vscode.window.activeTextEditor;
        editor.edit((editBuilder) => {
          const selection = editor.selection;
          editBuilder.replace(selection, translatedText);
        });
      }
    });
}

async function createAndInsertTranslation(selectedText, rootPath, command = 'php') {
    const createArgs = ['artisan', 'waka:tradauto', 'create', escapeShellArg(selectedText)];
    const createProcess = spawn(command, createArgs, { cwd: rootPath });

    let createStdout = '';
    createProcess.stdout.on('data', (data) => {
      createStdout += data.toString();
    });

    createProcess.stderr.on('data', (data) => {
      vscode.window.showErrorMessage(`Error: ${data}`);
    });

    createProcess.on('close', async (code) => {
      if (code !== 0) {
        vscode.window.showErrorMessage(`Error: child process exited with code ${code}`);
        return;
      }

      const newTranslation = await vscode.window.showInputBox({
        prompt: 'Enter translated text:',
      });

      if (newTranslation === undefined) {
        return;
      }

      updateTranslation(selectedText, newTranslation);
    });
  }

function escapeShellArg(arg) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

module.exports = {
  launchEdit
};