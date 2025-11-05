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

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case 'saveIpAddress':
              try {
                // Save IP address to user settings
                const config = vscode.workspace.getConfiguration();
                await config.update('public_ip_address', message.ipAddress, vscode.ConfigurationTarget.Global);
                
                // Send confirmation back to webview
                panel.webview.postMessage({
                  command: 'ipAddressSaved',
                  success: true,
                  ipAddress: message.ipAddress
                });
                
                // Show information message to user
                vscode.window.showInformationMessage(`IP address ${message.ipAddress} saved to user settings.`);
                
                console.log(`IP address saved to user settings: ${message.ipAddress}`);
              } catch (error) {
                console.error('Error saving IP address to settings:', error);
                panel.webview.postMessage({
                  command: 'ipAddressSaved',
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
                vscode.window.showErrorMessage('Failed to save IP address to settings.');
              }
              break;
            case 'getStoredIpAddress':
              try {
                // Get stored IP address from user settings
                const config = vscode.workspace.getConfiguration();
                const storedIp = config.get('public_ip_address') as string;
                
                panel.webview.postMessage({
                  command: 'storedIpAddress',
                  ipAddress: storedIp || null
                });
              } catch (error) {
                console.error('Error getting stored IP address:', error);
                panel.webview.postMessage({
                  command: 'storedIpAddress',
                  ipAddress: null
                });
              }
              break;
          }
        },
        undefined,
        context.subscriptions
      );

      // Load content from the HTML file
      panel.webview.html = getWebviewContentFromFile(context);
    })
  );

  // Add command to show stored IP address
  context.subscriptions.push(
    vscode.commands.registerCommand("helloworld.showStoredIpAddress", () => {
      try {
        const config = vscode.workspace.getConfiguration();
        const storedIp = config.get('public_ip_address') as string;
        
        if (storedIp) {
          vscode.window.showInformationMessage(`Stored IP Address: ${storedIp}`);
        } else {
          vscode.window.showInformationMessage('No IP address has been stored yet. Use the "Who Am I" tool to fetch and save your IP address.');
        }
      } catch (error) {
        vscode.window.showErrorMessage('Failed to retrieve stored IP address.');
      }
    })
  );

  // Add command to clear stored IP address
  context.subscriptions.push(
    vscode.commands.registerCommand("helloworld.clearStoredIpAddress", async () => {
      try {
        const config = vscode.workspace.getConfiguration();
        await config.update('public_ip_address', undefined, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Stored IP address has been cleared.');
      } catch (error) {
        vscode.window.showErrorMessage('Failed to clear stored IP address.');
      }
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

    // Modify the JavaScript to add VS Code API communication
    const modifiedJsContent = `
// VS Code API for webview communication
const vscode = acquireVsCodeApi();

${jsContent}

// Override the getIpAddress method to save to VS Code settings
const originalClass = WhoAmI;
class WhoAmIExtended extends originalClass {
    async getIpAddress() {
        try {
            this.showLoading('ip');
            this.hideError();

            // Get IP address from API
            const response = await fetch('https://api.ipify.org?format=json');
            
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }

            const data = await response.json();
            this.ipAddress = data.ip;

            // Save IP address to VS Code user settings
            vscode.postMessage({
                command: 'saveIpAddress',
                ipAddress: this.ipAddress
            });

            this.hideLoading('ip');
            this.displayIpAddress(this.ipAddress);
            this.showDetailsSection();

        } catch (error) {
            console.error('Error getting IP address:', error);
            this.hideLoading('ip');
            this.showError('Failed to get your IP address. Please check your internet connection and try again.');
        }
    }

    init() {
        super.init();
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'ipAddressSaved':
                    if (message.success) {
                        console.log('IP address successfully saved to user settings:', message.ipAddress);
                    } else {
                        console.error('Failed to save IP address:', message.error);
                    }
                    break;
                case 'storedIpAddress':
                    if (message.ipAddress) {
                        console.log('Found stored IP address:', message.ipAddress);
                        // Optionally pre-populate the IP if you want
                        // this.ipAddress = message.ipAddress;
                        // this.displayIpAddress(message.ipAddress);
                    }
                    break;
            }
        });

        // Request stored IP address on initialization
        vscode.postMessage({
            command: 'getStoredIpAddress'
        });
    }
}

// Replace the global initialization
document.addEventListener('DOMContentLoaded', () => {
    window.whoAmIApp = new WhoAmIExtended();
});
`;

    // Inline the CSS and modified JS into the HTML for webview compatibility
    const webviewContent = htmlContent
      .replace(
        '<link rel="stylesheet" href="who_am_i.css" id="main-stylesheet">',
        `<style id="main-stylesheet">\n${cssContent}\n</style>`
      )
      .replace(
        '<script src="who_am_i.js" id="main-script"></script>',
        `<script id="main-script">\n${modifiedJsContent}\n</script>`
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
