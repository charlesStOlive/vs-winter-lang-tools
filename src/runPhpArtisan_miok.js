const vscode = require('vscode');
const { spawn } = require('child_process');

class ArtisanCommand {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
  }

  run(command, args, onData, onError, onClose) {
    const childProcess = spawn(command, args, {
      cwd: this.workspaceRoot,
    });

    childProcess.stdout.on('data', onData);
    childProcess.stderr.on('data', onError);
    childProcess.on('close', onClose);
  }
}

module.exports = async function runPhpArtisan() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  const selectedText = editor.document.getText(editor.selection);

  if (!selectedText) {
    vscode.window.showErrorMessage('No text selected.');
    return;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder is open.');
    return;
  }
  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  const artisanCommand = new ArtisanCommand(workspaceRoot);
  const getArgs = ['artisan', 'waka:tradauto', 'get', `"${selectedText}"`];

  artisanCommand.run(
    'php',
    getArgs,
    (data) => {
      // onData
      let stdoutArray = {};
      try {
        stdoutArray = JSON.parse(data);
      } catch (errorJson) {
        vscode.window.showErrorMessage(`Error: ${errorJson.message}`);
      }

      const showCreateFileOption = stdoutArray.code === 'error_file';
      const inputLabel = showCreateFileOption
        ? 'Voulez-vous créer le fichier ?'
        : 'Enter translated text:';

      vscode.window
        .showInputBox({
          prompt: inputLabel,
          value: showCreateFileOption ? '' : stdoutArray.translation || '',
        })
        .then((input) => {
          if (input === undefined) {
            return;
          }

          if (showCreateFileOption && input.toLowerCase() === 'oui') {
            const createArgs = ['artisan', 'waka:tradauto', 'create', `"${selectedText}"`];
            artisanCommand.run(
              'php',
              createArgs,
              (data) => {
                // onData
              },
              (data) => {
                // onError
                vscode.window.showErrorMessage(`Error: ${data}`);
              },
              async (code) => {
                // onClose
                if (code !== 0) {
                  vscode.window.showErrorMessage(`Error: child process exited with code ${code}`);
                  return;
                }

                const newTranslation = await vscode.window.showInputBox({
                  prompt: 'Enter translated text:',
                  value: '',
                });

                if (newTranslation === undefined) {
                  return;
                }

                updateTranslation(selectedText, newTranslation);
              }
            );
          } else {
            updateTranslation(selectedText, input);
          }
        });
    },
    (data) => {
      // onError
      vscode.window.showErrorMessage(`Error: ${data}`);
    },
    (code) => {
      // onClose
      if (code !== 0) {
        vscode.window.showErrorMessage(`Error: child process exited with code ${code}`);
      }
    }
  );

  function updateTranslation(selectedText, translatedText) {
    const insertArgs = ['artisan', 'waka:tradauto', 'insert', `"${selectedText}"`, `"${translatedText}"`];

    artisanCommand.run(
      'php',
      insertArgs,
      (data) => {
        // onData
        if (data.toString().trim() === 'true') {
          const editor = vscode.window.activeTextEditor;
          editor.edit((editBuilder) => {
            const selection = editor.selection;
            editBuilder.replace(selection, translatedText);
          });
        }
      },
      (data) => {
        // onError
        vscode.window.showErrorMessage(`Error: ${data}`);
      },
      (code) => {
        // onClose
        if (code !== 0) {
          vscode.window.showErrorMessage(`Error: child process exited with code ${code}`);
        }
      }
    );
  }
};
