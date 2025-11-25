import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ToolVersion {
  available: boolean;
  version?: string;
  path?: string;
  error?: string;
  rawOutput?: string;
}

interface WawAppEnvCheck {
  flutter: ToolVersion;
  dart: ToolVersion;
  java: ToolVersion;
  gradle: ToolVersion;
  firebase: ToolVersion;
  node: ToolVersion;
  npm: ToolVersion;
  git: ToolVersion;
  vscode: ToolVersion;
}

async function checkTool(command: string, versionArg: string = '--version'): Promise<ToolVersion> {
  try {
    const { stdout, stderr } = await execAsync(`${command} ${versionArg}`, {
      timeout: 10000,
      encoding: 'utf8'
    });

    const output = (stdout || stderr).trim();

    return {
      available: true,
      version: parseVersion(output, command),
      rawOutput: output
    };
  } catch (error: any) {
    return {
      available: false,
      error: error.message
    };
  }
}

function parseVersion(output: string, command: string): string {
  // Try to extract version from common patterns
  const lines = output.split('\n');

  // For Flutter
  if (command === 'flutter') {
    const flutterLine = lines.find(l => l.includes('Flutter'));
    if (flutterLine) {
      const match = flutterLine.match(/Flutter\s+([\d.]+)/i);
      if (match) return match[1];
    }
  }

  // For Dart
  if (command === 'dart') {
    const dartLine = lines.find(l => l.includes('Dart'));
    if (dartLine) {
      const match = dartLine.match(/Dart\s+SDK\s+version:\s+([\d.]+)/i);
      if (match) return match[1];
    }
  }

  // For Java
  if (command === 'java') {
    const javaLine = lines.find(l => l.includes('version'));
    if (javaLine) {
      const match = javaLine.match(/version\s+"?([\d._]+)/i);
      if (match) return match[1];
    }
  }

  // For Gradle
  if (command === 'gradle') {
    const gradleLine = lines.find(l => l.includes('Gradle'));
    if (gradleLine) {
      const match = gradleLine.match(/Gradle\s+([\d.]+)/i);
      if (match) return match[1];
    }
  }

  // For Firebase
  if (command === 'firebase') {
    const match = output.match(/(\d+\.\d+\.\d+)/);
    if (match) return match[1];
  }

  // For Node, npm, git - usually first line
  const match = output.match(/(\d+\.\d+\.\d+)/);
  if (match) return match[1];

  // Return first line if no pattern matched
  return lines[0] || 'Unknown';
}

export async function checkWawAppEnv(): Promise<WawAppEnvCheck> {
  const [flutter, dart, java, gradle, firebase, node, npm, git, vscode] = await Promise.all([
    checkTool('flutter'),
    checkTool('dart'),
    checkTool('java', '-version'),
    checkTool('gradle', '-v'),
    checkTool('firebase'),
    checkTool('node', '-v'),
    checkTool('npm', '-v'),
    checkTool('git', '--version'),
    checkTool('code', '--version')
  ]);

  return {
    flutter,
    dart,
    java,
    gradle,
    firebase,
    node,
    npm,
    git,
    vscode
  };
}
