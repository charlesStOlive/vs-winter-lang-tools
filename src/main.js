const vscode = require('vscode');
const LangChecker = require('./langChecker');
const runPhpArtisan = require('./runPhpArtisan');

function activate(context) {
  let analyzeCodeDisposable = vscode.commands.registerCommand('vs-winter-lang-tools.analyzeCode', async () => {
    const langChecker = new LangChecker();
    await langChecker.analyzeAllDirectories();
  });
  context.subscriptions.push(analyzeCodeDisposable);

  let runPhpArtisanDisposable = vscode.commands.registerCommand('vs-winter-lang-tools.runPhpArtisan', runPhpArtisan);
  context.subscriptions.push(runPhpArtisanDisposable);
}
exports.activate = activate;

function deactivate() { }
exports.deactivate = deactivate;