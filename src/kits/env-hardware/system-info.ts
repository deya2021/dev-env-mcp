import { spawn } from 'child_process';

interface SystemInfo {
  os: {
    name: string;
    version: string;
    build: string;
  };
  cpu: {
    name: string;
    logicalCores: number;
  };
  memory: {
    totalGB: number;
    availableGB: number;
  };
  disk: {
    drives: Array<{
      name: string;
      type: string;
      sizeGB: number;
    }>;
  };
}

function runPowerShell(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell', ['-NoProfile', '-Command', command], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ps.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ps.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PowerShell command failed: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function getSystemInfo(): Promise<SystemInfo> {
  try {
    // Get OS info
    const osInfo = await runPowerShell(
      'Get-ComputerInfo | Select-Object OsName,OsVersion,OsBuildNumber | ConvertTo-Json'
    );
    const osData = JSON.parse(osInfo);

    // Get CPU info
    const cpuInfo = await runPowerShell(
      'Get-CimInstance Win32_Processor | Select-Object Name,NumberOfLogicalProcessors | ConvertTo-Json'
    );
    const cpuData = JSON.parse(cpuInfo);

    // Get memory info
    const memInfo = await runPowerShell(
      'Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory | ConvertTo-Json'
    );
    const memData = JSON.parse(memInfo);

    // Get disk info
    const diskInfo = await runPowerShell(
      'Get-PhysicalDisk | Select-Object FriendlyName,MediaType,Size | ConvertTo-Json'
    );
    const diskData = JSON.parse(diskInfo);

    return {
      os: {
        name: osData.OsName || 'Unknown',
        version: osData.OsVersion || 'Unknown',
        build: osData.OsBuildNumber || 'Unknown'
      },
      cpu: {
        name: Array.isArray(cpuData) ? cpuData[0]?.Name || 'Unknown' : cpuData.Name || 'Unknown',
        logicalCores: Array.isArray(cpuData) ? cpuData[0]?.NumberOfLogicalProcessors || 0 : cpuData.NumberOfLogicalProcessors || 0
      },
      memory: {
        totalGB: Math.round((memData.TotalVisibleMemorySize * 1024) / (1024 * 1024 * 1024) * 100) / 100,
        availableGB: Math.round((memData.FreePhysicalMemory * 1024) / (1024 * 1024 * 1024) * 100) / 100
      },
      disk: {
        drives: Array.isArray(diskData) 
          ? diskData.map(d => ({
              name: d.FriendlyName || 'Unknown',
              type: d.MediaType || 'Unknown',
              sizeGB: Math.round((d.Size || 0) / (1024 * 1024 * 1024) * 100) / 100
            }))
          : [{
              name: diskData.FriendlyName || 'Unknown',
              type: diskData.MediaType || 'Unknown',
              sizeGB: Math.round((diskData.Size || 0) / (1024 * 1024 * 1024) * 100) / 100
            }]
      }
    };
  } catch (error) {
    throw new Error(`Failed to get system info: ${error}`);
  }
}