"use strict";

const fs = require("fs");
const path = require("path");
const { runTests } = require("@vscode/test-electron");

const root = path.join(__dirname, "..", "..");

function resolveVSCodeExecutable() {
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

async function main() {
  await runTests({
    vscodeExecutablePath: resolveVSCodeExecutable(),
    extensionDevelopmentPath: root,
    extensionTestsPath: path.join(__dirname, "suite", "index.js"),
    launchArgs: [root],
    extensionTestsEnv: {
      TSPERF_REPO_ROOT: root,
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
