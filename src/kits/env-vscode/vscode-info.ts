import { spawn } from 'child_process';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

interface VSCodeInfo {
  version: string;
  amazonQExtension: {
    installed: boolean;
    version?: string;
    path?: string;
  };
  settings: {
    user: Record<string, any>;
    workspace: Record<string, any>;
  };
}

function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function getVSCodeVersion(): Promise<string> {
  try {
    const output = await runCommand('C:\\Users\\user\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd', ['--version']);
    return output.split('\n')[0] || 'Unknown';
  } catch {
    return 'Not installed or not accessible';
  }
}

async function getAmazonQExtension() {
  try {
    const extensionsDir = join(homedir(), '.vscode', 'extensions');
    const entries = await readdir(extensionsDir);
    
    const amazonQDir = entries.find(entry => 
      entry.startsWith('amazonwebservices.amazon-q-vscode')
    );

    if (!amazonQDir) {
      return { installed: false };
    }

    const extensionPath = join(extensionsDir, amazonQDir);
    const packageJsonPath = join(extensionPath, 'package.json');
    
    try {
      const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
      return {
        installed: true,
        version: packageJson.version,
        path: extensionPath
      };
    } catch {
      return {
        installed: true,
        version: 'Unknown',
        path: extensionPath
      };
    }
  } catch {
    return { installed: false };
  }
}

async function getSettings() {
  const settings = { user: {}, workspace: {} };

  // User settings
  try {
    const userSettingsPath = join(homedir(), 'AppData', 'Roaming', 'Code', 'User', 'settings.json');
    const userSettings = JSON.parse(await readFile(userSettingsPath, 'utf-8'));
    
    // Filter Amazon Q related settings
    settings.user = Object.fromEntries(
      Object.entries(userSettings).filter(([key]) => 
        key.toLowerCase().includes('amazonq') || key.toLowerCase().includes('amazon-q')
      )
    );
  } catch {
    // User settings not found or invalid
  }

  // Workspace settings
  try {
    const workspaceSettingsPath = join(process.cwd(), '.vscode', 'settings.json');
    const workspaceSettings = JSON.parse(await readFile(workspaceSettingsPath, 'utf-8'));
    
    // Filter Amazon Q related settings
    settings.workspace = Object.fromEntries(
      Object.entries(workspaceSettings).filter(([key]) => 
        key.toLowerCase().includes('amazonq') || key.toLowerCase().includes('amazon-q')
      )
    );
  } catch {
    // Workspace settings not found or invalid
  }

  return settings;
}

export async function getVSCodeInfo(): Promise<VSCodeInfo> {
  const [version, amazonQExtension, settings] = await Promise.all([
    getVSCodeVersion(),
    getAmazonQExtension(),
    getSettings()
  ]);

  return {
    version,
    amazonQExtension,
    settings
  };
}