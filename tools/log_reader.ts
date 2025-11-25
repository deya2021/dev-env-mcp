import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface LogFile {
  path: string;
  name: string;
  size: number;
  modified: Date;
  content?: string;
}

interface LogsResult {
  amazonQLogs: LogFile[];
  claudeCodeLogs: LogFile[];
  errors: string[];
}

function getWorkspaceStoragePath(): string {
  const homeDir = os.homedir();
  const platform = os.platform();

  if (platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
      'Code',
      'User',
      'workspaceStorage'
    );
  } else if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'Code', 'User', 'workspaceStorage');
  } else {
    return path.join(homeDir, '.config', 'Code', 'User', 'workspaceStorage');
  }
}

async function findLogFiles(baseDir: string, extensionPattern: string): Promise<LogFile[]> {
  const logFiles: LogFile[] = [];

  try {
    const workspaces = await fs.readdir(baseDir);

    for (const workspace of workspaces) {
      const workspacePath = path.join(baseDir, workspace);
      const stat = await fs.stat(workspacePath);

      if (!stat.isDirectory()) continue;

      const extensionLogPath = path.join(workspacePath, extensionPattern);

      try {
        const extensionStat = await fs.stat(extensionLogPath);
        if (extensionStat.isDirectory()) {
          const logDir = path.join(extensionLogPath, 'logs');
          try {
            const logDirStat = await fs.stat(logDir);
            if (logDirStat.isDirectory()) {
              const files = await fs.readdir(logDir);

              for (const file of files) {
                if (file.endsWith('.log') || file.endsWith('.txt')) {
                  const filePath = path.join(logDir, file);
                  const fileStat = await fs.stat(filePath);

                  logFiles.push({
                    path: filePath,
                    name: file,
                    size: fileStat.size,
                    modified: fileStat.mtime
                  });
                }
              }
            }
          } catch {
            // No logs directory
          }
        }
      } catch {
        // Extension directory not found in this workspace
      }
    }
  } catch (error) {
    // Base directory doesn't exist or can't be read
  }

  // Sort by modification time (most recent first)
  logFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());

  return logFiles;
}

async function readRecentLogs(logFiles: LogFile[], maxFiles: number = 5, maxSizePerFile: number = 50000): Promise<void> {
  const filesToRead = logFiles.slice(0, maxFiles);

  for (const logFile of filesToRead) {
    try {
      let content = await fs.readFile(logFile.path, 'utf-8');

      // If file is too large, read only the last portion
      if (content.length > maxSizePerFile) {
        content = '...[truncated]...\n' + content.slice(-maxSizePerFile);
      }

      logFile.content = content;
    } catch (error) {
      logFile.content = `Error reading file: ${error}`;
    }
  }
}

export async function getExtensionLogs(options?: {
  includeContent?: boolean;
  maxFiles?: number;
  maxSizePerFile?: number;
}): Promise<LogsResult> {
  const errors: string[] = [];
  const workspaceStoragePath = getWorkspaceStoragePath();

  const {
    includeContent = true,
    maxFiles = 5,
    maxSizePerFile = 50000
  } = options || {};

  let amazonQLogs: LogFile[] = [];
  let claudeCodeLogs: LogFile[] = [];

  try {
    await fs.access(workspaceStoragePath);
  } catch {
    errors.push(`Workspace storage path not accessible: ${workspaceStoragePath}`);
    return { amazonQLogs, claudeCodeLogs, errors };
  }

  try {
    amazonQLogs = await findLogFiles(workspaceStoragePath, 'amazonwebservices.amazon-q-vscode');
    if (includeContent) {
      await readRecentLogs(amazonQLogs, maxFiles, maxSizePerFile);
    }
  } catch (error: any) {
    errors.push(`Error reading Amazon Q logs: ${error.message}`);
  }

  try {
    claudeCodeLogs = await findLogFiles(workspaceStoragePath, 'anthropic.claude-code');
    if (includeContent) {
      await readRecentLogs(claudeCodeLogs, maxFiles, maxSizePerFile);
    }
  } catch (error: any) {
    errors.push(`Error reading Claude Code logs: ${error.message}`);
  }

  return {
    amazonQLogs,
    claudeCodeLogs,
    errors
  };
}
