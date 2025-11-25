import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

interface DevEnvOverview {
  os: {
    platform: string;
    release: string;
    version: string;
    arch: string;
  };
  cpu: {
    model: string;
    cores: number;
    logicalCores: number;
  };
  memory: {
    totalGB: number;
    freeGB: number;
  };
  disk: {
    type?: string;
    freeSpaceGB?: number;
    totalSpaceGB?: number;
  };
}

async function getDiskInfo(): Promise<{ type?: string; freeSpaceGB?: number; totalSpaceGB?: number }> {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Get disk type using PowerShell
      const diskTypeCmd = 'powershell -Command "Get-PhysicalDisk | Select-Object -First 1 -ExpandProperty MediaType"';
      const { stdout: diskType } = await execAsync(diskTypeCmd);

      // Get disk space for C: drive
      const diskSpaceCmd = 'powershell -Command "Get-PSDrive C | Select-Object Free,Used | ConvertTo-Json"';
      const { stdout: diskSpaceJson } = await execAsync(diskSpaceCmd);
      const diskSpace = JSON.parse(diskSpaceJson);

      const freeSpaceGB = Math.round((diskSpace.Free / (1024 ** 3)) * 100) / 100;
      const usedSpaceGB = Math.round((diskSpace.Used / (1024 ** 3)) * 100) / 100;
      const totalSpaceGB = Math.round((freeSpaceGB + usedSpaceGB) * 100) / 100;

      return {
        type: diskType.trim(),
        freeSpaceGB,
        totalSpaceGB
      };
    } else if (platform === 'darwin') {
      // macOS
      const { stdout } = await execAsync('df -h / | tail -1');
      const parts = stdout.split(/\s+/);
      const totalSpace = parts[1];
      const freeSpace = parts[3];

      return {
        type: 'Unknown (macOS)',
        freeSpaceGB: parseFloat(freeSpace),
        totalSpaceGB: parseFloat(totalSpace)
      };
    } else {
      // Linux
      const { stdout } = await execAsync('df -BG / | tail -1');
      const parts = stdout.split(/\s+/);
      const totalSpace = parseInt(parts[1].replace('G', ''));
      const freeSpace = parseInt(parts[3].replace('G', ''));

      // Try to detect SSD vs HDD
      try {
        const { stdout: rotational } = await execAsync('cat /sys/block/sda/queue/rotational');
        const diskType = rotational.trim() === '0' ? 'SSD' : 'HDD';
        return { type: diskType, freeSpaceGB: freeSpace, totalSpaceGB: totalSpace };
      } catch {
        return { freeSpaceGB: freeSpace, totalSpaceGB: totalSpace };
      }
    }
  } catch (error) {
    return { type: 'Unknown' };
  }
}

export async function getDevEnvOverview(): Promise<DevEnvOverview> {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const diskInfo = await getDiskInfo();

  return {
    os: {
      platform: os.platform(),
      release: os.release(),
      version: os.version ? os.version() : 'N/A',
      arch: os.arch()
    },
    cpu: {
      model: cpus[0]?.model || 'Unknown',
      cores: cpus.length,
      logicalCores: cpus.length
    },
    memory: {
      totalGB: Math.round((totalMem / (1024 ** 3)) * 100) / 100,
      freeGB: Math.round((freeMem / (1024 ** 3)) * 100) / 100
    },
    disk: diskInfo
  };
}
