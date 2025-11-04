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
    console.log('HTML content length:', htmlContent.length);
    
    // Parse HTML into a hierarchical structure
    const rootElements = this.parseHTMLHierarchy(htmlContent);
    
    console.log(`Built hierarchical tree with ${rootElements.length} root elements`);
    
    return rootElements;
  }

  private parseHTMLHierarchy(htmlContent: string): Dependency[] {
    // Stack to track parent elements during parsing
    const stack: Dependency[] = [];
    const roots: Dependency[] = [];
    
    // Self-closing tags that don't have children
    const selfClosingTags = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'track', 'wbr']);
    
    // Find all opening and closing tags
    const tagRegex = /<\/?(\w+)([^>]*)>/g;
    let match;
    
    while ((match = tagRegex.exec(htmlContent)) !== null) {
      const fullMatch = match[0];
      const tagName = match[1].toLowerCase();
      const attributes = match[2];
      
      // Skip doctype, comments, etc.
      if (tagName === '!doctype' || fullMatch.startsWith('<!--')) {
        continue;
      }
      
      const isClosingTag = fullMatch.startsWith('</');
      const isSelfClosing = fullMatch.endsWith('/>') || selfClosingTags.has(tagName);
      
      if (isClosingTag) {
        // Pop from stack when we find a closing tag
        if (stack.length > 0 && stack[stack.length - 1].tagName === tagName) {
          stack.pop();
        }
      } else {
        // Opening tag - create element
        const id = this.extractAttribute(attributes, 'id');
        const className = this.extractAttribute(attributes, 'class');
        
        let label = `<${tagName}>`;
        if (id) {
          label += ` #${id}`;
        }
        if (className) {
          label += ` .${className.split(' ')[0]}`;
        }
        
        const description = id || className || tagName;
        
        // Determine collapsible state
        let collapsibleState = vscode.TreeItemCollapsibleState.None;
        if (!isSelfClosing && !selfClosingTags.has(tagName)) {
          collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        
        const element = new Dependency(label, description, collapsibleState);
        element.tagName = tagName;
        element.elementId = id || '';
        element.className = className || '';
        
        // Add to parent or root
        if (stack.length > 0) {
          const parent = stack[stack.length - 1];
          parent.children.push(element);
          // Update parent to be expandable if it has children
          parent.updateCollapsibleState();
        } else {
          roots.push(element);
        }
        
        // Push to stack if not self-closing
        if (!isSelfClosing) {
          stack.push(element);
        }
      }
    }
    
    return roots;
  }

  private extractAttribute(attributes: string, attrName: string): string {
    const regex = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, 'i');
    const match = attributes.match(regex);
    return match ? match[1] : '';
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
  public tagName: string = '';
  public elementId: string = '';
  public className: string = '';

  constructor(
    public readonly label: string,
    private version: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  updateCollapsibleState() {
    if (this.children.length > 0) {
      // Create a new TreeItem with updated collapsible state
      const newItem = new Dependency(this.label, this.version, vscode.TreeItemCollapsibleState.Collapsed);
      newItem.children = this.children;
      newItem.tagName = this.tagName;
      newItem.elementId = this.elementId;
      newItem.className = this.className;
      
      // Copy properties to this instance
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
  }

  iconPath = new vscode.ThemeIcon('symbol-misc');
}
