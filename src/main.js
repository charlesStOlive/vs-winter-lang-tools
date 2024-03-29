const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const updateLangFromArtisan = require('./updateLangFromArtisan');
const searchLangFromArtisan = require('./searchLangFromArtisan');
const { launchEdit, launchCkeckTrad } = require('./translationUtils');
const JsonTreeProvider = require('./jsonTreeProvider');


async  function activate(context) {
  
  //
  let runUpdateLang = vscode.commands.registerCommand('vs-winter-lang-tools.updateLangFromArtisan', updateLangFromArtisan);
  context.subscriptions.push(runUpdateLang);

  let runSearchFromArtisan = vscode.commands.registerCommand('vs-winter-lang-tools.searchLangFromArtisan', searchLangFromArtisan);
  context.subscriptions.push(runSearchFromArtisan);
  try {
  console.log('before searchLangFromArtisan');
  await vscode.commands.executeCommand('vs-winter-lang-tools.searchLangFromArtisan');
  console.log('after searchLangFromArtisan');
} catch (error) {
  console.error('Error executing command:', error);
}

  const  jsonTreeProvider = new JsonTreeProvider({});
  vscode.window.registerTreeDataProvider('langTreeView', jsonTreeProvider);

  

  vscode.commands.registerCommand('vs-winter-lang-tools.updateTreeView', (newData) => {
    console.log('vs-winter-lang-tools.updateTreeView', newData)
    jsonTreeProvider.jsonData = newData;
    jsonTreeProvider.refresh();
  });

  const myCommand1 = vscode.commands.registerCommand('extension.searchLangKey', (node) => {
    // Vous pouvez accéder aux propriétés du nœud ici, par exemple node.label ou node.keyPath
    vscode.window.showInformationMessage(`Searching: ${node.label}`);
    let newString = node.keyPath.replace(".lang", "::lang");
    // Copier `newString` dans le presse-papier
    // Copier `newString` dans le presse-papier
    vscode.env.clipboard.writeText(newString).then(() => {
      // Ouvrir le panneau de recherche
      vscode.commands.executeCommand('workbench.view.search').then(() => {
        // Coller `newString` dans le champ de recherche
        vscode.commands.executeCommand('editor.action.clipboardPasteAction');
      });
    });
  });
  context.subscriptions.push(myCommand1);

  const myCommand2 = vscode.commands.registerCommand('extension.saveLangKey', (node) => {
    vscode.window.showInformationMessage(`Saving: ${node.label}`);
    let newString = node.keyPath.replace(".lang", "::lang");
    launchEdit(newString);
  });
  context.subscriptions.push(myCommand2);

  let myCommand3 = vscode.commands.registerCommand('extension.openLang', (node) => {
    // Gérer le cas où aucun dossier n'est ouvert.
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('No folder is open.');
      return;
    }
    // Diviser la clé en composants.
    const parts = node.keyPath.split('.');
    if (parts.length < 2) {
      vscode.window.showErrorMessage('Key path format invalid');
      return;
    }
    // Obtenir le chemin du répertoire de travail
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    // Vérifier que le chemin n'est pas nul
    if (!rootPath) {
      vscode.window.showErrorMessage('No root path found.');
      return;
    }
    // Construction du chemin d'accès au fichier.
    const vendor = parts[0];
    const plugin = parts[1];
    const fileName = 'lang.php';
    const filePath = path.join(rootPath, 'plugins', vendor, plugin, 'lang', 'fr', fileName);
    // Vérification de l'existence du fichier.
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // Le fichier n'existe pas.
        vscode.window.showErrorMessage(`File ${filePath} not found!`);
      } else {
        // Le fichier existe, l'ouvrir dans l'éditeur.
        let uri = vscode.Uri.file(filePath);
        vscode.workspace.openTextDocument(uri).then(doc => {
          vscode.window.showTextDocument(doc);
        });
      }
    });
  });
  context.subscriptions.push(myCommand3);

  const myCommand4 = vscode.commands.registerCommand('extension.copyLangKey', (node) => {
    let newString = node.keyPath.replace(".lang", "::lang");
    vscode.env.clipboard.writeText(newString)
    vscode.window.showInformationMessage(`Copy: ${newString}`);
    // Ici vous implémentez la logique pour la sauvegarde de la clé de langage
  });
  context.subscriptions.push(myCommand4);

  const myCommand5 = vscode.commands.registerCommand('extension.relaunchSearch', (node) => {
    vscode.window.showInformationMessage('Je relance la recherche des langues');
    vscode.commands.executeCommand('vs-winter-lang-tools.searchLangFromArtisan');
    // Ici vous implémentez la logique pour la sauvegarde de la clé de langage
  });
  context.subscriptions.push(myCommand5);

   const myCommand6 = vscode.commands.registerCommand('extension.launchCheckTradCommand', (node) => {
    vscode.window.showInformationMessage('Je lance waka Checktrads');
    launchCkeckTrad(context);
    // Ici vous implémentez la logique pour la sauvegarde de la clé de langage
  });
  context.subscriptions.push(myCommand6);
}
exports.activate = activate;

function deactivate() { }
exports.deactivate = deactivate;
