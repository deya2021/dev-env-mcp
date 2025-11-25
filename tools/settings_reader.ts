import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface SettingsResult {
  userSettings: Record<string, any> | null;
  workspaceSettings: Record<string, any> | null;
  mergedSettings: Record<string, any>;
  paths: {
    userSettingsPath: string;
    workspaceSettingsPath: string;
  };
  errors: string[];
}

function getVSCodeSettingsPath(): string {
  const platform = os.platform();
  const homeDir = os.homedir();

  if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'Code', 'User', 'settings.json');
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'settings.json');
  } else {
    return path.join(homeDir, '.config', 'Code', 'User', 'settings.json');
  }
}

async function readJsonFile(filePath: string): Promise<Record<string, any> | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    // VS Code settings.json may have comments, so we need to strip them
    const jsonString = content
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments

    return JSON.parse(jsonString);
  } catch (error: any) {
    return null;
  }
}

export async function readVSCodeSettings(workspaceDir?: string): Promise<SettingsResult> {
  const errors: string[] = [];
  const userSettingsPath = getVSCodeSettingsPath();
  const workspaceSettingsPath = workspaceDir
    ? path.join(workspaceDir, '.vscode', 'settings.json')
    : path.join(process.cwd(), '.vscode', 'settings.json');

  const userSettings = await readJsonFile(userSettingsPath);
  if (!userSettings) {
    errors.push(`Failed to read user settings from: ${userSettingsPath}`);
  }

  const workspaceSettings = await readJsonFile(workspaceSettingsPath);
  if (!workspaceSettings) {
    errors.push(`Failed to read workspace settings from: ${workspaceSettingsPath}`);
  }

  // Merge settings (workspace overrides user)
  const mergedSettings = {
    ...(userSettings || {}),
    ...(workspaceSettings || {})
  };

  return {
    userSettings,
    workspaceSettings,
    mergedSettings,
    paths: {
      userSettingsPath,
      workspaceSettingsPath
    },
    errors
  };
}

export async function getAmazonQSettings(workspaceDir?: string): Promise<Record<string, any>> {
  const settings = await readVSCodeSettings(workspaceDir);
  const qSettings: Record<string, any> = {};

  for (const [key, value] of Object.entries(settings.mergedSettings)) {
    if (key.startsWith('amazonQ.') || key.startsWith('aws.')) {
      qSettings[key] = value;
    }
  }

  return qSettings;
}

export async function getClaudeCodeSettings(workspaceDir?: string): Promise<Record<string, any>> {
  const settings = await readVSCodeSettings(workspaceDir);
  const claudeSettings: Record<string, any> = {};

  for (const [key, value] of Object.entries(settings.mergedSettings)) {
    if (key.startsWith('claude.') || key.startsWith('anthropic.')) {
      claudeSettings[key] = value;
    }
  }

  return claudeSettings;
}
