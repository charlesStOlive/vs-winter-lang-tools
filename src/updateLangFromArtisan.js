const vscode = require('vscode');
const { spawn } = require('child_process');
const { launchEdit } = require('./translationUtils');

module.exports = async function updateLangFromArtisan() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage('No active editor found.');
    return;
  }

  let selectedText = editor.document.getText(editor.selection);

  // Si aucun texte n'est sélectionné, trouvez le texte autour du curseur.
  if (!selectedText) {
    const cursorPosition = editor.selection.active;

    // Obtenez la ligne de texte où le curseur est placé.
    const lineText = editor.document.lineAt(cursorPosition.line).text;

    let startPosition = cursorPosition.character;
    let endPosition = cursorPosition.character;

    // Recherchez la position de début de la sélection.
    while (startPosition > 0 && !/\s|['"]/.test(lineText.charAt(startPosition - 1))) {
      startPosition--;
    }

    // Recherchez la position de fin de la sélection.
    while (endPosition < lineText.length && !/\s|['"]/.test(lineText.charAt(endPosition))) {
      endPosition++;
    }

    selectedText = lineText.slice(startPosition, endPosition);

    // Si le texte capturé se termine par ":", l'exclure.
    if (selectedText.endsWith(':')) {
      selectedText = selectedText.slice(0, -1);
      endPosition--;  // déplacez la position de fin un caractère en arrière pour exclure les ":"
    }

    // Mettez à jour la sélection visuelle dans l'éditeur.
    const startSelection = new vscode.Position(cursorPosition.line, startPosition);
    const endSelection = new vscode.Position(cursorPosition.line, endPosition);
    editor.selection = new vscode.Selection(startSelection, endSelection);

    if (!selectedText) {
      vscode.window.showErrorMessage('No text selected and no suitable text found around the cursor.');
      return;
    }
  }

  launchEdit(selectedText)
};
