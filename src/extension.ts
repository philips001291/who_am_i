// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DOMVisualizerProvider } from "./TreeDataProvider";

// Check whether the opened workspace contains the required who_am_i.html file
function isWhoAmIWorkspaceOpen(): boolean {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return false;
  }

  for (const folder of folders) {
    const candidate = path.join(folder.uri.fsPath, "who_am_i.html");
    if (fs.existsSync(candidate)) {
      return true;
    }
  }

  return false;
}

// Show activation information dialog
function showWhoAmIActivationMessage() {
  const message = '"Who Am I" extension is now active!';
  vscode.window
    .showInformationMessage(message, "Open who_am_i.html", "View in Browser")
    .then((selection) => {
      if (selection === "Open who_am_i.html") {
        openWhoAmIFileInEditor();
      } else if (selection === "View in Browser") {
        openWhoAmIFileInBrowser();
      }
    });
}

async function openWhoAmIFileInEditor() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return;
  for (const folder of folders) {
    const candidate = path.join(folder.uri.fsPath, "who_am_i.html");
    if (fs.existsSync(candidate)) {
      const uri = vscode.Uri.file(candidate);
      await vscode.window.showTextDocument(uri);
      return;
    }
  }
}

async function openWhoAmIFileInBrowser() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return;
  for (const folder of folders) {
    const candidate = path.join(folder.uri.fsPath, "who_am_i.html");
    if (fs.existsSync(candidate)) {
      const uri = vscode.Uri.file(candidate);
      await vscode.env.openExternal(uri);
      return;
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('"Who Am I" extension activating...');

  // If the correct workspace is open, show activation message.
  if (isWhoAmIWorkspaceOpen()) {
    showWhoAmIActivationMessage();
  } else {
    // If not, show an error message guiding the user.
    vscode.window.showErrorMessage(
      '"Who Am I" workspace not detected. Open a folder containing who_am_i.html to activate the extension.'
    );
  }

  // Register a command to open the bundled template workspace (optional helper)
  const openTemplateCmd = vscode.commands.registerCommand(
    "helloworld.openWhoAmIWorkspace",
    async () => {
      try {
        const templatePath = path.join(
          context.extensionPath,
          "templates",
          "who_am_i_workspace"
        );
        if (!fs.existsSync(templatePath)) {
          vscode.window.showErrorMessage(
            "Who Am I template workspace not found inside the extension."
          );
          return;
        }

        const uri = vscode.Uri.file(templatePath);
        // Open the template folder as a workspace in a new window
        await vscode.commands.executeCommand("vscode.openFolder", uri);
      } catch (err) {
        vscode.window.showErrorMessage(
          `Failed to open template workspace: ${err}`
        );
      }
    }
  );

  context.subscriptions.push(openTemplateCmd);

  // Register DOM Visualizer TreeDataProvider
  const rootPath =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  console.log("Root path for DOM Visualizer:", rootPath);

  if (rootPath) {
    // Check if who_am_i.html exists in the root path
    const htmlFilePath = path.join(rootPath, "who_am_i.html");
    console.log("Looking for who_am_i.html at:", htmlFilePath);
    console.log("who_am_i.html exists:", fs.existsSync(htmlFilePath));

    // Register the DOM visualizer tree data provider
    const domProvider = new DOMVisualizerProvider(rootPath);
    vscode.window.registerTreeDataProvider("domVisualizer", domProvider);
  } else {
    console.log("No workspace folders found - DOM Visualizer not registered");
  }

  // Also re-check when the workspace folders change while the extension is active
  const watcher = vscode.workspace.onDidChangeWorkspaceFolders(() => {
    if (isWhoAmIWorkspaceOpen()) {
      showWhoAmIActivationMessage();
    }
  });

  context.subscriptions.push(watcher);
}

export function deactivate() {}
