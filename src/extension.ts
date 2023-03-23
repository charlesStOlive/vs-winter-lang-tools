import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as util from 'util';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('vs-winter-lang-tools.analyzeCode', async () => {
    const config = vscode.workspace.getConfiguration('vs-winter-lang-tools');
    const dirsToAnalyze = config.get<string[]>('dirsToAnalyze');

    if (dirsToAnalyze) {
      for (const dir of dirsToAnalyze) {
        console.log(dir);
        try {
          await analyzeDirectory(dir);
        } catch (error) {
          console.error(`Erreur lors de l'analyse du répertoire ${dir}:`, error);
        }
      }
    } else {
      vscode.window.showErrorMessage("Erreur de configuration : impossible de récupérer les répertoires à analyser.");
    }
  });

  context.subscriptions.push(disposable);
}

async function analyzeDirectory(dir: string) {
  // Obtenez le chemin du dossier de travail
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("Aucun dossier de travail ouvert.");
    return;
  }

  // Utilisez le chemin du dossier de travail pour construire le chemin du répertoire
  const dirPath = path.join(workspaceFolder, dir);

  const files = await fs.readdir(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await analyzeDirectory(path.join(dir, file)); // Passer le chemin relatif au lieu du chemin absolu
    } else {
      try {
        await analyzeFile(filePath);
      } catch (error) {
        console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
      }
    }
  }
}

async function analyzeFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const regex = /([a-z0-9_.]+)::([a-z0-9_.]+)\.([a-z0-9_]+)/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [matchedString, vendorPlugin, modelName, key] = match;
      const [vendor, plugin] = vendorPlugin.split('.');
  
      // Vérifiez que les valeurs vendor et plugin sont définies
      if (!vendor || !plugin) {
        continue;
      }
  
      // Affichez les valeurs vendor et plugin dans la console
      // console.log(`vendor: ${vendor}, plugin: ${plugin}`);
  
      await processMatch(vendorPlugin, modelName, key);
    }
  } catch (error: any) {
    console.log(`Une erreur est survenue lors de l'analyse du fichier ${filePath}: ${error.message}`);
  }
}

async function processMatch(vendorPlugin: string, modelName: string, dottedKey: string) {
  try {
    // Obtenez le chemin du dossier de travail
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    console.log(workspaceFolder)
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("Aucun dossier de travail ouvert.");
      return;
    }
  
    const [vendor, plugin] = vendorPlugin.split('.');
    const targetDir = path.join(workspaceFolder, 'plugins', vendor.toLowerCase(), plugin.toLowerCase(), 'lang', 'fr');
    const targetFile = path.join(targetDir, modelName.toLowerCase() + '.php');
    console.log(targetFile)
    await fs.ensureDir(targetDir);
  
    let langArray: any = {};
    if (await fs.pathExists(targetFile)) {
      const content = await fs.readFile(targetFile, 'utf-8');
      langArray = eval(content.substring(content.indexOf('{')));
    }

    const keyParts = dottedKey.split('.');
    let currentLevel = langArray;

    keyParts.forEach((keyPart, index) => {
      const isLast = index === keyParts.length - 1;
      if (isLast) {
        if (!currentLevel.hasOwnProperty(keyPart)) {
          currentLevel[keyPart] = keyPart.charAt(0).toUpperCase() + keyPart.slice(1);
        }
      } else {
        if (!currentLevel.hasOwnProperty(keyPart)) {
          currentLevel[keyPart] = {};
        }
        currentLevel = currentLevel[keyPart];
      }
    });

    // Convertir langArray en une chaîne de caractères PHP
    const output = "<?php\nreturn " + toPhpString(langArray, 0) + ";\n";
    await fs.writeFile(targetFile, output);
    console.log(`Le fichier '${targetFile}' a été créé ou modifié.`);
  } catch (error: any) {
    console.log(`Une erreur est survenue lors du traitement de la clé '${dottedKey}' pour le modèle '${modelName}' du plugin '${vendorPlugin}': ${error.message}`);
    throw error;
  }
}

function getFileName(key: string): string {
  const parts = key.split("::");
  const fileName = parts[1].split(".")[0];
  return fileName;
}

function toPhpString(langArray: any, indent: number): string {
  let result = "";
  const pad = " ".repeat(indent * 2);
  if (Array.isArray(langArray)) {
    result += "[";
    for (let i = 0; i < langArray.length; i++) {
      result += `\n${pad}  ${toPhpString(langArray[i], indent + 1)},`;
    }
    result += `\n${pad}]`;
  } else if (typeof langArray === "object") {
    result += "{";
    for (const key in langArray) {
      if (Object.prototype.hasOwnProperty.call(langArray, key)) {
        const value = langArray[key];
        if (Array.isArray(value)) {
          result += `\n${pad}  '${key}' => ${toPhpString(value, indent + 1)},`;
        } else if (typeof value === "object") {
          result += `\n${pad}  '${key}' => ${toPhpString(value, indent + 1)},`;
        } else {
          result += `\n${pad}  '${key}' => '${value}',`;
        }
      }
    }
    result += `\n${pad}}`;
  } else if (typeof langArray === "string") {
    result += `'${langArray}'`;
  }
  return result;
}

