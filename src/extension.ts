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

  context.subscriptions.push(
    vscode.commands.registerCommand("helloworld.openAsWebview", () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        "whoAmIWebview", // Identifies the type of the webview. Used internally
        "Who am I", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          // Enable scripts in the webview
          enableScripts: true,
          // Restrict the webview to only loading content from our extension's directory
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, "src"),
            vscode.Uri.joinPath(context.extensionUri, "who_am_i_workspace"),
          ],
        }
      );
      // Load content from the HTML file
      panel.webview.html = getWebviewContentFromFile(context);
    })
  );
}
function getWebviewContentFromFile(context: vscode.ExtensionContext): string {
  const fs = require("fs");
  const path = require("path");

  try {
    // Get path to the HTML file in who_am_i_workspace directory
    const htmlPath = path.join(
      context.extensionPath,
      "who_am_i_workspace",
      "who_am_i.html"
    );
    const cssPath = path.join(
      context.extensionPath,
      "who_am_i_workspace",
      "who_am_i.css"
    );
    const jsPath = path.join(
      context.extensionPath,
      "who_am_i_workspace",
      "who_am_i.js"
    );

    // Read the files
    const htmlContent = fs.readFileSync(htmlPath, "utf8");
    const cssContent = fs.readFileSync(cssPath, "utf8");
    const jsContent = fs.readFileSync(jsPath, "utf8");

    // Inline the CSS and JS into the HTML for webview compatibility
    const webviewContent = htmlContent
      .replace(
        '<link rel="stylesheet" href="who_am_i.css" id="main-stylesheet">',
        `<style id="main-stylesheet">\n${cssContent}\n</style>`
      )
      .replace(
        '<script src="who_am_i.js" id="main-script"></script>',
        `<script id="main-script">\n${jsContent}\n</script>`
      );

    return webviewContent;
  } catch (error) {
    console.error("Error reading HTML file:", error);
    // Fallback to inline content if file reading fails
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Who am I - Error</title>
    <style>
        body { 
            font-family: var(--vscode-font-family); 
            color: var(--vscode-foreground); 
            background-color: var(--vscode-editor-background); 
            padding: 20px; 
        }
    </style>
</head>
<body>
    <h1>⚠️ Error Loading Content</h1>
    <p>Could not load the HTML file.</p>
    <p><strong>Error:</strong> ${error}</p>
    <p>Make sure the who_am_i.html file exists in the who_am_i_workspace directory.</p>
</body>
</html>`;
  }
}

export function deactivate() {}
