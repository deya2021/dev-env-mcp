import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

interface Extension {
  id: string;
  version: string;
  metadata?: any;
}

interface ExtensionInfo {
  totalExtensions: number;
  extensions: Extension[];
  amazonQ?: Extension;
  claudeCode?: Extension;
  flutter?: Extension;
  dart?: Extension;
  errors: string[];
}

async function getExtensionsFromCLI(): Promise<Extension[]> {
  try {
    const { stdout } = await execAsync('code --list-extensions --show-versions', {
      timeout: 30000
    });

    const extensions: Extension[] = [];
    const lines = stdout.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const match = line.match(/^(.+)@(.+)$/);
      if (match) {
        extensions.push({
          id: match[1],
          version: match[2]
        });
      }
    }

    return extensions;
  } catch (error) {
    throw new Error(`Failed to list extensions via CLI: ${error}`);
  }
}

function getExtensionsDir(): string {
  const homeDir = os.homedir();
  const platform = os.platform();

  if (platform === 'win32') {
    return path.join(homeDir, '.vscode', 'extensions');
  } else {
    return path.join(homeDir, '.vscode', 'extensions');
  }
}

async function getExtensionMetadata(extensionId: string, version: string): Promise<any> {
  const extensionsDir = getExtensionsDir();
  const extensionDir = path.join(extensionsDir, `${extensionId}-${version}`);

  try {
    const packageJsonPath = path.join(extensionDir, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

export async function getExtensionInfo(): Promise<ExtensionInfo> {
  const errors: string[] = [];
  let extensions: Extension[] = [];

  try {
    extensions = await getExtensionsFromCLI();
  } catch (error: any) {
    errors.push(error.message);
    return {
      totalExtensions: 0,
      extensions: [],
      errors
    };
  }

  // Find specific extensions
  const amazonQ = extensions.find(ext =>
    ext.id.includes('amazon-q') || ext.id.includes('amazonwebservices.amazon-q')
  );

  const claudeCode = extensions.find(ext =>
    ext.id.includes('claude') && ext.id.includes('anthropic')
  );

  const flutter = extensions.find(ext =>
    ext.id.toLowerCase().includes('dart-code.flutter')
  );

  const dart = extensions.find(ext =>
    ext.id.toLowerCase().includes('dart-code.dart-code')
  );

  // Try to get metadata for important extensions
  if (amazonQ) {
    try {
      amazonQ.metadata = await getExtensionMetadata(amazonQ.id, amazonQ.version);
    } catch (error) {
      // Metadata not critical
    }
  }

  if (claudeCode) {
    try {
      claudeCode.metadata = await getExtensionMetadata(claudeCode.id, claudeCode.version);
    } catch (error) {
      // Metadata not critical
    }
  }

  return {
    totalExtensions: extensions.length,
    extensions,
    amazonQ,
    claudeCode,
    flutter,
    dart,
    errors
  };
}
