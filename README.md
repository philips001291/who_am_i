# Who Am I — VS Code Extension

**Who Am I** is an educational and interactive Visual Studio Code extension designed to showcase how to work with Webviews, TreeViews, message passing, DOM parsing, settings storage, and workspace integration inside a custom extension.

It is built as a practical onboarding-style project, demonstrating real-world extension development concepts in a simple and visual way.

---

## 🚀 Features

### **1. Interactive Webview ("Who Am I" Page)**  
Displays a responsive HTML interface that:
- Fetches the user's **public IP address** using the IPify API.
- Retrieves extended information (location, hostname, ISP, etc.) using IPinfo (if enabled).
- Shows loading states, error states, and a details section dynamically.
- Automatically saves fetched IP to VS Code user settings via `acquireVsCodeApi()` messaging.

### **2. DOM Visualizer TreeView**  
A custom Explorer view that:
- Parses `who_am_i.html` using `node-html-parser`.
- Shows all HTML elements as nested Tree Items.
- Updates when the HTML file is changed or refreshed.
- Supports synchronized removal of elements through keybindings.

### **3. HTML Element Removal (Keybinding: Ctrl+Alt+R)**  
After the user selects an HTML tag inside the editor:
- Pressing **Ctrl+Alt+R** removes that element **and all its children**.
- The Webview and TreeView update immediately after the file is saved.
- Ensures consistent structure across all extension components.

### **4. Workspace Initialization & Requirements Check**  
The extension activates only if the workspace contains a **who_am_i.html** file.  
Upon activation:
- The user is notified the extension is active.
- Quick actions are offered: *Open file* or *View in browser*.

### **5. Original File Backup & Recovery**  
Upon first activation:
- The extension saves the **original who_am_i.html** content.
- Users can restore the original version at any time via the Command Palette:

**Command:** `Who Am I: Recover original file`

This resets:
- HTML file  
- TreeView  
- Webview  

---

## 📦 Requirements

No external dependencies are required for basic functionality.

Optional:
- Internet access if IP-based APIs are used (IPify, IPinfo).

The extension uses:
- VS Code Webview API  
- TreeDataProvider  
- Node HTML Parser  
- Workspace and User Settings API  

All dependencies install automatically when the extension is built.

---

## ⚙️ Extension Settings

This extension contributes the following settings:

### **`whoAmI.saveBackup`**
- **Type:** boolean  
- **Default:** true  
- If enabled, the original HTML file is backed up on first activation.

### **`whoAmI.originalContent`**
- Internal setting storing the backup contents of `who_am_i.html`.

### **`whoAmI.lastIpAddress`**
- Stores the most recently fetched public IP address from the Webview script.

---

## 🐞 Known Issues

- Removing deeply nested HTML elements may cause overlapping refresh events in both TreeView and Webview.
- Requires workspace reload after deleting the entire `who_am_i.html` file.
- DOM Visualizer may display empty text nodes depending on HTML formatting.

---

## 📝 Release Notes

### **1.0.0**
- Initial release of the *Who Am I* extension.
- Added Webview with dynamic IP fetching.
- Added DOM Visualizer Explorer View.
- Added removal keybinding (Ctrl+Alt+R).
- Added workspace settings for backup and recovery.

### **1.1.0**
- Improved synchronization between Webview and TreeView.
- Added better error handling for API calls.
- Stabilized HTML element parsing.

### **1.2.0**
- Added “Recover original file” command.
- Improved activation logic and workspace validation.

---

## 📘 Following Extension Guidelines

Make sure to follow official VS Code extension development guidelines:

- https://code.visualstudio.com/api/references/extension-guidelines

---

## ✍️ Working With Markdown

Useful shortcuts in VS Code:
- Split editor: `Ctrl+\`
- Preview Markdown: `Ctrl+Shift+V`
- Markdown snippets: `Ctrl+Space`

---

## 🔗 Additional Resources

- **VS Code Markdown Documentation:** https://code.visualstudio.com/docs/languages/markdown  
- **General Markdown Syntax:** https://help.github.com/articles/markdown-basics/  

---

**Enjoy using the Who Am I extension!**
