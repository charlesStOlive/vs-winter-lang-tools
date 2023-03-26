const { spawn } = require('child_process');

function createArtisanCommand(vscode) {
  function run(command, args, onData, onError, onClose) {
    const cmd = spawn(command, args, {
      cwd: vscode.workspace.rootPath,
      env: process.env
    });

    cmd.stdout.on('data', (data) => {
      onData(data.toString());
    });

    cmd.stderr.on('data', (data) => {
      onError(data.toString());
    });

    cmd.on('close', (code) => {
      onClose(code);
    });
  }

  return {
    run
  };
}

module.exports = createArtisanCommand;
