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
    
    // Store provider reference globally (not on context since it's not extensible)
    (global as any).domProvider = domProvider;
    
    // Add file watcher to refresh TreeView when HTML files change
    const watcher = vscode.workspace.createFileSystemWatcher('**/who_am_i.html');
    
    watcher.onDidChange(() => {
      console.log('who_am_i.html file changed, refreshing TreeView');
      domProvider.refresh();
    });
    
    watcher.onDidCreate(() => {
      console.log('who_am_i.html file created, refreshing TreeView');
      domProvider.refresh();
    });
    
    watcher.onDidDelete(() => {
      console.log('who_am_i.html file deleted, refreshing TreeView');
      domProvider.refresh();
    });

    context.subscriptions.push(watcher);
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

  // Step 6: Command to remove selected HTML element and its children
  const removeHtmlElementCommand = vscode.commands.registerCommand("helloworld.removeHtmlElement", async () => {
    console.log('HTML element removal command triggered');
    const editor = vscode.window.activeTextEditor;
      
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
      }

      // Check if the file is an HTML file
      if (!editor.document.fileName.endsWith('.html')) {
        vscode.window.showErrorMessage('This command only works with HTML files.');
        return;
      }

      const selection = editor.selection;
      const document = editor.document;
      
      // Allow operation even if selection is empty - use cursor position
      const cursorOffset = selection.isEmpty ? 
        document.offsetAt(selection.active) : 
        document.offsetAt(selection.start);

      try {
        // Get the full text of the document
        const fullText = document.getText();
        
        console.log(`Attempting to remove HTML element at position ${cursorOffset}`);
        
        // Find the complete HTML element that contains the cursor/selection
        const elementRange = findCompleteHtmlElement(fullText, cursorOffset);
        
        if (!elementRange) {
          // Provide more helpful error message
          const line = document.lineAt(document.positionAt(cursorOffset));
          vscode.window.showErrorMessage(
            `Could not find a complete HTML element at line ${line.lineNumber + 1}. ` +
            `Make sure your cursor is inside an HTML tag or select the element you want to remove.`
          );
          return;
        }
        
        // Show which element will be removed
        const elementText = fullText.substring(elementRange.start, elementRange.end);
        const elementPreview = elementText.length > 100 ? 
          elementText.substring(0, 100) + '...' : 
          elementText;
        
        console.log(`Found element to remove: ${elementPreview}`);
        
        // Ask for confirmation
        const result = await vscode.window.showWarningMessage(
          `Remove HTML element: ${elementPreview}?`,
          { modal: false },
          'Remove',
          'Cancel'
        );
        
        if (result !== 'Remove') {
          return;
        }

        // Remove the element by replacing it with empty string
        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
          document.positionAt(elementRange.start),
          document.positionAt(elementRange.end)
        );
        
        edit.replace(document.uri, range, '');
        
        const success = await vscode.workspace.applyEdit(edit);
        
        if (success) {
          await document.save();
          vscode.window.showInformationMessage('HTML element and its children removed successfully.');
          
          // Refresh TreeView and WebView
          refreshViews();
        } else {
          vscode.window.showErrorMessage('Failed to remove HTML element.');
        }
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error removing HTML element: ${error}`);
      }
    });

  context.subscriptions.push(removeHtmlElementCommand);
  console.log('HTML element removal command registered successfully');
  
  // Log all registered commands for debugging
  console.log('Extension activated successfully with the following subscriptions:');
  console.log(`- Total subscriptions: ${context.subscriptions.length}`);
  
  // Test if command is available
  vscode.commands.getCommands().then(commands => {
    const hasRemoveCommand = commands.includes('helloworld.removeHtmlElement');
    console.log(`Command 'helloworld.removeHtmlElement' registered: ${hasRemoveCommand}`);
  });

  // Step 7: Backup original files when extension activates
  backupOriginalFiles();

  // Step 7: Command to recover original files
  context.subscriptions.push(
    vscode.commands.registerCommand("helloworld.recoverOriginalFile", async () => {
      const editor = vscode.window.activeTextEditor;
      
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found. Please open the file you want to recover.');
        return;
      }

      try {
        const fileName = path.basename(editor.document.fileName);
        const backupContent = await getBackupContent(editor.document.uri);
        
        if (!backupContent) {
          vscode.window.showErrorMessage(`No backup found for ${fileName}. The file may not have been backed up yet.`);
          return;
        }

        // Show confirmation dialog
        const result = await vscode.window.showWarningMessage(
          `This will replace the current content of ${fileName} with the original backup. This action cannot be undone.`,
          { modal: true },
          'Recover Original',
          'Cancel'
        );

        if (result === 'Recover Original') {
          // Replace entire file content with backup
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            editor.document.positionAt(0),
            editor.document.positionAt(editor.document.getText().length)
          );
          
          edit.replace(editor.document.uri, fullRange, backupContent);
          
          const success = await vscode.workspace.applyEdit(edit);
          
          if (success) {
            await editor.document.save();
            vscode.window.showInformationMessage(`${fileName} has been recovered to its original state.`);
            
            // Reset TreeView and other extension state
            resetExtensionState();
          } else {
            vscode.window.showErrorMessage('Failed to recover the original file.');
          }
        }
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error recovering original file: ${error}`);
      }
    })
  );

  // Step 7: Command to show available backups
  context.subscriptions.push(
    vscode.commands.registerCommand("helloworld.showBackups", async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
      }

      try {
        const config = vscode.workspace.getConfiguration('whoAmI', workspaceFolder.uri);
        const allSettings = config.inspect('');
        
        // Get all backup keys from workspace configuration
        const workspaceConfig = (allSettings as any)?.workspaceValue || {};
        const backupKeys = Object.keys(workspaceConfig).filter(key => key.startsWith('backup_') && !key.endsWith('_timestamp'));
        
        if (backupKeys.length === 0) {
          vscode.window.showInformationMessage('No backups found in the current workspace.');
          return;
        }

        const backupList = backupKeys.map(key => {
          const fileName = key.replace('backup_', '');
          const content = config.get(key) as string;
          const size = content ? `${Math.round(content.length / 1024 * 100) / 100} KB` : 'Unknown';
          const timestampKey = `${key}_timestamp`;
          const timestamp = config.get(timestampKey) as string;
          const timeStr = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown';
          return `• ${fileName} (${size}) - Created: ${timeStr}`;
        }).join('\n');

        vscode.window.showInformationMessage(
          `Found ${backupKeys.length} backup(s):\n\n${backupList}`,
          { modal: true }
        );
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error retrieving backups: ${error}`);
      }
    })
  );

  // Step 7: Command to clear all backups
  context.subscriptions.push(
    vscode.commands.registerCommand("helloworld.clearBackups", async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found.');
        return;
      }

      try {
        const result = await vscode.window.showWarningMessage(
          'This will permanently delete all backup files. This action cannot be undone.',
          { modal: true },
          'Clear All Backups',
          'Cancel'
        );

        if (result === 'Clear All Backups') {
          const config = vscode.workspace.getConfiguration('whoAmI', workspaceFolder.uri);
          const allSettings = config.inspect('');
          
          // Get all backup keys from workspace configuration
          const workspaceConfig = (allSettings as any)?.workspaceValue || {};
          const backupKeys = Object.keys(workspaceConfig).filter(key => key.startsWith('backup_'));
          
          // Clear all backup-related keys
          for (const key of backupKeys) {
            await config.update(key, undefined, vscode.ConfigurationTarget.Workspace);
          }
          
          vscode.window.showInformationMessage(`Cleared ${backupKeys.length} backup entries.`);
        }
        
      } catch (error) {
        vscode.window.showErrorMessage(`Error clearing backups: ${error}`);
      }
    })
  );

  // Step 7: Command to manually backup current file
  context.subscriptions.push(
    vscode.commands.registerCommand("helloworld.backupCurrentFile", async () => {
      const editor = vscode.window.activeTextEditor;
      
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found. Please open a file to backup.');
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('File is not in a workspace folder.');
        return;
      }

      try {
        await backupSingleFile(editor.document.fileName, workspaceFolder.uri);
        const fileName = path.basename(editor.document.fileName);
        vscode.window.showInformationMessage(`${fileName} has been backed up successfully.`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to backup file: ${error}`);
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

// Step 6: Helper function to find complete HTML element
function findCompleteHtmlElement(text: string, offset: number): {start: number, end: number} | null {
  console.log(`Looking for HTML element at offset ${offset}`);
  
  // Find the opening tag that contains or starts before the offset
  let tagStart = -1;
  let tagName = '';
  
  // First, search backwards for an opening tag
  for (let i = offset; i >= 0; i--) {
    if (text[i] === '<' && i < text.length - 1) {
      // Skip comments and closing tags
      if (text.substring(i, i + 4) === '<!--' || text[i + 1] === '/') {
        continue;
      }
      
      // Found potential opening tag
      const remainingText = text.substring(i);
      const tagMatch = remainingText.match(/^<([a-zA-Z][a-zA-Z0-9\-]*)[^>]*>/);
      if (tagMatch) {
        tagStart = i;
        tagName = tagMatch[1].toLowerCase();
        console.log(`Found opening tag: ${tagName} at position ${tagStart}`);
        break;
      }
    }
    
    // If we hit a closing tag before finding an opening tag, stop searching backwards
    if (text[i] === '>' && i > 0 && text[i - 1] !== '/') {
      // Look for the start of this tag
      let tagStartPos = i;
      while (tagStartPos > 0 && text[tagStartPos] !== '<') {
        tagStartPos--;
      }
      if (text[tagStartPos + 1] === '/') {
        // This is a closing tag, we've gone too far
        break;
      }
    }
  }
  
  // If not found backwards, search forwards from cursor position
  if (tagStart === -1) {
    console.log('No opening tag found backwards, searching forwards...');
    for (let i = offset; i < text.length; i++) {
      if (text[i] === '<' && i < text.length - 1) {
        // Skip comments and closing tags
        if (text.substring(i, i + 4) === '<!--' || text[i + 1] === '/') {
          continue;
        }
        
        const remainingText = text.substring(i);
        const tagMatch = remainingText.match(/^<([a-zA-Z][a-zA-Z0-9\-]*)[^>]*>/);
        if (tagMatch) {
          tagStart = i;
          tagName = tagMatch[1].toLowerCase();
          console.log(`Found opening tag forward: ${tagName} at position ${tagStart}`);
          break;
        }
      }
    }
  }
  
  if (tagStart === -1 || !tagName) {
    console.log('No HTML tag found');
    return null;
  }
  
  // Find the end of the opening tag
  const openingTagEnd = text.indexOf('>', tagStart);
  if (openingTagEnd === -1) {
    console.log('Malformed opening tag');
    return null;
  }
  
  const openingTag = text.substring(tagStart, openingTagEnd + 1);
  
  // Check if it's a self-closing tag
  if (openingTag.endsWith('/>')) {
    console.log(`Self-closing tag found: ${tagName}`);
    return { start: tagStart, end: openingTagEnd + 1 };
  }
  
  // Check if it's a void element (doesn't need closing tag)
  const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
  if (voidElements.includes(tagName)) {
    console.log(`Void element found: ${tagName}`);
    return { start: tagStart, end: openingTagEnd + 1 };
  }
  
  // Find matching closing tag
  const closingTag = `</${tagName}>`;
  let depth = 1;
  let searchStart = openingTagEnd + 1;
  
  console.log(`Looking for closing tag: ${closingTag}`);
  
  while (depth > 0 && searchStart < text.length) {
    // Look for any opening or closing tag of the same type
    const nextOpenPattern = new RegExp(`<${tagName}(?:\\s|>)`, 'i');
    const nextOpenMatch = nextOpenPattern.exec(text.substring(searchStart));
    const nextOpenPos = nextOpenMatch ? searchStart + nextOpenMatch.index : -1;
    
    const nextClosePos = text.indexOf(closingTag, searchStart);
    
    if (nextClosePos === -1) {
      console.log(`No matching closing tag found for ${tagName}`);
      return null;
    }
    
    if (nextOpenPos !== -1 && nextOpenPos < nextClosePos) {
      // Found another opening tag before the closing tag
      console.log(`Found nested ${tagName} tag, increasing depth`);
      depth++;
      searchStart = nextOpenPos + tagName.length + 1;
    } else {
      // Found a closing tag
      depth--;
      console.log(`Found closing tag, depth now: ${depth}`);
      if (depth === 0) {
        const endPos = nextClosePos + closingTag.length;
        console.log(`Complete element found: ${tagStart} to ${endPos}`);
        return { start: tagStart, end: endPos };
      }
      searchStart = nextClosePos + closingTag.length;
    }
  }
  
  console.log(`Unmatched opening tag: ${tagName}`);
  return null;
}

// Helper function to refresh TreeView and WebView
function refreshViews() {
  // Get the stored provider reference and refresh TreeView
  const activeContext = (global as any).extensionContext;
  if (activeContext && (activeContext as any).domProvider) {
    (activeContext as any).domProvider.refresh();
    console.log('TreeView refreshed after HTML element removal');
  } else {
    console.log('TreeView provider not found, using fallback refresh');
    // Fallback: reload the entire window if provider reference is lost
    vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

// Step 7: Helper functions for backup and recovery

// Backup original files when extension activates
async function backupOriginalFiles() {
  console.log('Starting backup of original files...');
  
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    console.log('No workspace folders found for backup');
    return;
  }

  for (const folder of folders) {
    // Look for who_am_i.html files in various locations
    const filesToBackup = [
      path.join(folder.uri.fsPath, "who_am_i.html"),
      path.join(folder.uri.fsPath, "who_am_i_workspace", "who_am_i.html"),
      path.join(folder.uri.fsPath, "who_am_i_workspace", "who_am_i.css"),
      path.join(folder.uri.fsPath, "who_am_i_workspace", "who_am_i.js")
    ];

    for (const filePath of filesToBackup) {
      if (fs.existsSync(filePath)) {
        try {
          await backupSingleFile(filePath, folder.uri);
        } catch (error) {
          console.error(`Error backing up ${filePath}:`, error);
        }
      }
    }
  }
  
  console.log('Backup process completed');
}

// Backup a single file to workspace settings
async function backupSingleFile(filePath: string, workspaceUri: vscode.Uri) {
  try {
    const fileName = path.basename(filePath);
    const config = vscode.workspace.getConfiguration('whoAmI', workspaceUri);
    
    // Check if backup already exists
    const backupKey = `backup_${fileName}`;
    const existingBackup = config.get(backupKey);
    
    if (!existingBackup) {
      const content = fs.readFileSync(filePath, 'utf8');
      await config.update(backupKey, content, vscode.ConfigurationTarget.Workspace);
      console.log(`Created backup for ${fileName}`);
      
      // Also store backup timestamp
      await config.update(`${backupKey}_timestamp`, new Date().toISOString(), vscode.ConfigurationTarget.Workspace);
    } else {
      console.log(`Backup already exists for ${fileName}`);
    }
  } catch (error) {
    console.error(`Error backing up file ${filePath}:`, error);
    throw error;
  }
}

// Get backup content for a file
async function getBackupContent(fileUri: vscode.Uri): Promise<string | null> {
  try {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
    if (!workspaceFolder) {
      return null;
    }

    const fileName = path.basename(fileUri.fsPath);
    const config = vscode.workspace.getConfiguration('whoAmI', workspaceFolder.uri);
    const backupKey = `backup_${fileName}`;
    
    const backup = config.get(backupKey) as string;
    return backup || null;
  } catch (error) {
    console.error('Error getting backup content:', error);
    return null;
  }
}

// Reset extension state after recovery
function resetExtensionState() {
  console.log('Resetting extension state...');
  
  // Refresh TreeView if it exists
  const domProvider = (global as any).domProvider;
  if (domProvider && typeof domProvider.refresh === 'function') {
    domProvider.refresh();
    console.log('TreeView refreshed after recovery');
  }
  
  // You can add more state reset logic here if needed
  console.log('Extension state reset completed');
}

export function deactivate() {}