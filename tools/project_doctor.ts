import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface ProjectDoctorResult {
  isWawAppProject: boolean;
  projectRoot?: string;
  doctorOutput?: string;
  diagnoseOutput?: string;
  errors: string[];
}

async function findWawAppRoot(startDir: string): Promise<string | null> {
  let currentDir = startDir;

  while (true) {
    const toolsDir = path.join(currentDir, 'tools');
    const doctorScript = path.join(toolsDir, 'doctor.ps1');

    try {
      await fs.access(doctorScript);
      return currentDir;
    } catch {
      // Not found, go up one directory
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // Reached root, not found
        return null;
      }
      currentDir = parentDir;
    }
  }
}

async function runPowerShellScript(scriptPath: string, cwd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
      {
        cwd,
        timeout: 60000,
        maxBuffer: 1024 * 1024 * 10 // 10MB
      }
    );

    return stdout + (stderr ? `\n\nSTDERR:\n${stderr}` : '');
  } catch (error: any) {
    throw new Error(`Failed to run script: ${error.message}\nOutput: ${error.stdout || ''}\nError: ${error.stderr || ''}`);
  }
}

export async function runProjectDoctor(customDir?: string): Promise<ProjectDoctorResult> {
  const errors: string[] = [];
  const startDir = customDir || process.cwd();

  const projectRoot = await findWawAppRoot(startDir);

  if (!projectRoot) {
    return {
      isWawAppProject: false,
      errors: ['Not a WawApp project - tools/doctor.ps1 not found']
    };
  }

  const toolsDir = path.join(projectRoot, 'tools');
  const doctorScript = path.join(toolsDir, 'doctor.ps1');
  const diagnoseScript = path.join(toolsDir, 'diagnose.ps1');

  let doctorOutput: string | undefined;
  let diagnoseOutput: string | undefined;

  // Run doctor.ps1
  try {
    doctorOutput = await runPowerShellScript(doctorScript, projectRoot);
  } catch (error: any) {
    errors.push(`doctor.ps1 failed: ${error.message}`);
    doctorOutput = `ERROR: ${error.message}`;
  }

  // Run diagnose.ps1 if it exists
  try {
    await fs.access(diagnoseScript);
    try {
      diagnoseOutput = await runPowerShellScript(diagnoseScript, projectRoot);
    } catch (error: any) {
      errors.push(`diagnose.ps1 failed: ${error.message}`);
      diagnoseOutput = `ERROR: ${error.message}`;
    }
  } catch {
    errors.push('diagnose.ps1 not found (this may be normal)');
  }

  return {
    isWawAppProject: true,
    projectRoot,
    doctorOutput,
    diagnoseOutput,
    errors
  };
}
