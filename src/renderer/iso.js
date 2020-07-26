const fs = require("fs");
const path = require("path");
const { runPowerShell } = require("./powershell");

async function createIsoWindows(options) {
  const { source } = options;
  const ps1Path = path.join(__dirname, `../script/iso.ps1`);
  const target = path.join(__dirname, "../basilisk/test.iso");

  if (!fs.existsSync(ps1Path)) {
    throw new Error(`createIsoWindows: Could not find ${ps1Path}`);
  }

  if (fs.existsSync(target)) {
    console.warn(`createIsoWindows: Target file exists, removing`);
    await fs.promises.unlink(target);
  }

  const fn = `. ${path.join(__dirname, `../script/iso.ps1`)}`;
  const cmd = `${fn}; $s = "${source}"; get-childitem "$s" | New-ISOFile -Media CDROM -path ${target}`;

  await runPowerShell(cmd);
}

module.exports = {
  createIsoWindows,
};

async function main() {
  const source = `C:\\Users\\felix\\Desktop\\test`;
  await createIsoWindows({ source }).catch(console.log);
}

main();
