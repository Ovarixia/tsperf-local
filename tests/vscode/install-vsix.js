"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { downloadAndUnzipVSCode, resolveCliPathFromVSCodeExecutablePath } = require("@vscode/test-electron");

const root = path.join(__dirname, "..", "..");
const manifest = require(path.join(root, "package.json"));
const vsixPath = path.join(root, `tsperf-local-${manifest.version}.vsix`);
const userDataDir = path.join(root, ".vscode-test", "install-user-data");
const extensionsDir = path.join(root, ".vscode-test", "install-extensions");

function localVSCodeExecutable() {
  if (process.env.VSCODE_EXECUTABLE_PATH) {
    return process.env.VSCODE_EXECUTABLE_PATH;
  }
  if (process.platform === "darwin") {
    const macExecutable = "/Applications/Visual Studio Code.app/Contents/MacOS/Electron";
    if (fs.existsSync(macExecutable)) {
      return macExecutable;
    }
  }
  return undefined;
}

async function resolveVSCodeCli() {
  const executable = localVSCodeExecutable() || (await downloadAndUnzipVSCode("stable"));
  return resolveCliPathFromVSCodeExecutablePath(executable);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result.stdout || "";
}

async function main() {
  if (!fs.existsSync(vsixPath)) {
    throw new Error(`Expected packaged VSIX at ${vsixPath}. Run npm run package first.`);
  }

  fs.rmSync(userDataDir, { recursive: true, force: true });
  fs.rmSync(extensionsDir, { recursive: true, force: true });
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.mkdirSync(extensionsDir, { recursive: true });

  const cli = await resolveVSCodeCli();
  run(cli, [
    "--user-data-dir",
    userDataDir,
    "--extensions-dir",
    extensionsDir,
    "--install-extension",
    vsixPath,
    "--force",
  ]);

  const installed = run(cli, [
    "--user-data-dir",
    userDataDir,
    "--extensions-dir",
    extensionsDir,
    "--list-extensions",
    "--show-versions",
  ]);

  const expected = `${manifest.publisher}.${manifest.name}@${manifest.version}`;
  if (!installed.split(/\r?\n/).includes(expected)) {
    throw new Error(`Expected ${expected} in isolated VS Code profile. Installed extensions:\n${installed}`);
  }

  console.log(JSON.stringify({ installed: expected, vsix: path.basename(vsixPath) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
