const { spawn } = require('child_process');
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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

async function launchCkeckTrad(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const command = 'php';
    const insertArgs = ['artisan', 'waka:checktrads'];
    const insertProcess = spawn(command, insertArgs, { cwd: rootPath });

    // Créer une variable pour stocker les données de sortie
    let outputData = '';
    vscode.window.showInformationMessage(`Lancement de la commande: waka:checktrads`);

    // Écouter l'événement de données sur le flux de sortie standard
    insertProcess.stdout.on('data', (data) => {
        outputData += data;
    });

    // Écouter l'événement 'close' pour détecter quand le processus se termine
    insertProcess.on('close', (code) => {
        if (code !== 0) {
            vscode.window.showErrorMessage(`Process exited with code: ${code}`);
            return;
        }

        // Créez et montrez une nouvelle webview
        const panel = vscode.window.createWebviewPanel(
            'commandOutput',
            'Output of Check Trad Command',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent(outputData, rootPath);

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        const filePath = path.join(rootPath, message.path);
                        const openPath = vscode.Uri.file(filePath);

                        vscode.workspace.openTextDocument(openPath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        }, err => {
                            vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
                        });

                        return;
                }
            },
            undefined,
            context.subscriptions // Vous devrez peut-être passer `context` en paramètre à votre fonction launchCheckTrad
        );
    });

    // Gérer les erreurs du processus
    insertProcess.stderr.on('data', (data) => {
        vscode.window.showErrorMessage(`Error: ${data}`);
    });

    insertProcess.on('error', (error) => {
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    });
}

function getWebviewContent(outputData, rootPath) {
    const extensionPath = path.resolve(__dirname, '..'); // ou votre chemin d'accès approprié à l'extension
    const htmlPath = path.join(extensionPath, 'html', 'output_checktrads.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const sanitizedOutput = outputData.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lineToHtml = line => {
        const match =  line.trim().match(/^(File updated: )(.*)(lang\.php)$/);
        return match
            ? `<div><a href="#" data-path="${match[2]}lang.php">${line}</a></div>`
            : `<div>${line.replace(/\n/g, '<br/>')}</div>`;
    };
    const lines = sanitizedOutput.split('\n').map(lineToHtml).join('');

    return htmlContent.replace('${lines}', lines); // Supposez que vous avez un placeholder ${lines} dans votre fichier HTML pour insérer du contenu dynamique
}

function escapeShellArg(arg) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

module.exports = {
  launchEdit,
  launchCkeckTrad
};