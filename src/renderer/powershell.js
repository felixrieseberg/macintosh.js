const { spawn } = require("child_process");

function runPowerShell(command) {
  return new Promise((resolve) => {
    let stdout = [];
    let stderr = [];
    let child;

    try {
      child = spawn("powershell.exe", [
        "-ExecutionPolicy",
        "Bypass",
        "-NoProfile",
        "-NoLogo",
        command,
      ]);
    } catch (error) {
      console.error(error);
      // This is dirty, but the best way for us to try/catch right now
      return reject(error);
    }

    child.stdout.on("data", (data) => {
      const str = data.toString();
      console.log(str);
      stdout.push(str);
    });
    child.stderr.on("data", (data) => {
      const str = data.toString();
      console.log(str);
      stderr.push(str);
    });

    child.on("exit", () => resolve({ stderr, stdout }));

    child.stdin.end();
  });
}

module.exports = {
  runPowerShell,
};
