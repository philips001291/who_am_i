import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class DOMVisualizerProvider implements vscode.TreeDataProvider<Dependency> {
  constructor(private workspaceRoot: string) {}

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    console.log('TreeDataProvider.getChildren called with:', element?.label || 'root');
    console.log('Workspace root:', this.workspaceRoot);
    
    if (!this.workspaceRoot) {
      console.log('No workspace root found');
      vscode.window.showInformationMessage('No workspace found');
      return Promise.resolve([]);
    }

    if (element) {
      // Return child elements if any
      return Promise.resolve(element.children || []);
    } else {
      // Look for who_am_i.html instead of package.json
      const htmlFilePath = path.join(this.workspaceRoot, 'who_am_i.html');
      console.log('Looking for who_am_i.html at:', htmlFilePath);
      
      if (this.pathExists(htmlFilePath)) {
        console.log('who_am_i.html found, parsing HTML structure');
        const htmlElements = this.parseHTMLFile(htmlFilePath);
        console.log('Found HTML elements:', htmlElements.length);
        return Promise.resolve(htmlElements);
      } else {
        console.log('No who_am_i.html found in workspace');
        vscode.window.showInformationMessage('Workspace has no who_am_i.html');
        return Promise.resolve([]);
      }
    }
  }

  /**
   * Parse HTML file and extract DOM elements with IDs
   */
  private parseHTMLFile(htmlFilePath: string): Dependency[] {
    try {
      const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
      return this.extractHTMLElements(htmlContent);
    } catch (error) {
      console.error('Error reading HTML file:', error);
      return [];
    }
  }

  private extractHTMLElements(htmlContent: string): Dependency[] {
    const elements: Dependency[] = [];
    
    console.log('HTML content length:', htmlContent.length);
    console.log('First 500 chars of HTML:', htmlContent.substring(0, 500));
    
    // Simple regex to find HTML tags with IDs
    const tagRegex = /<(\w+)([^>]*id\s*=\s*["']([^"']+)["'][^>]*)>/g;
    
    let match;
    let matchCount = 0;
    while ((match = tagRegex.exec(htmlContent)) !== null) {
      matchCount++;
      const tagName = match[1];
      const attributes = match[2];
      const id = match[3];
      
      console.log(`Found element ${matchCount}: <${tagName}> with id="${id}"`);
      
      // Get class if present
      const classMatch = attributes.match(/class\s*=\s*["']([^"']+)["']/);
      const className = classMatch ? classMatch[1].split(' ')[0] : '';
      
      const label = `<${tagName}> #${id}`;
      const description = className ? `.${className}` : tagName;
      
      elements.push(new Dependency(
        label,
        description,
        vscode.TreeItemCollapsibleState.None
      ));
    }
    
    console.log(`Total matches found: ${matchCount}, elements created: ${elements.length}`);
    
    return elements;
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}

class Dependency extends vscode.TreeItem {
  public children: Dependency[] = [];

  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  iconPath = {
    light: vscode.Uri.file(path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg')),
    dark: vscode.Uri.file(path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg'))
  };
}
