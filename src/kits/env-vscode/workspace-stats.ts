import { readdir, stat } from 'fs/promises';
import { join } from 'path';

interface WorkspaceStats {
  totalFiles: number;
  directorySizes: Record<string, number>;
  complexityScore: number;
  scanStopped: boolean;
  scannedFiles: number;
}

const IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.dart_tool', '.gradle', '.idea', '.vscode',
  'build', 'dist', 'out', '.next', 'target', 'bin', 'obj'
]);

const MAJOR_DIRS = ['.git', 'node_modules', '.dart_tool'];

async function walkDirectory(
  dirPath: string, 
  maxFiles: number,
  stats: { fileCount: number; dirSizes: Record<string, number>; stopped: boolean }
): Promise<void> {
  if (stats.stopped || stats.fileCount >= maxFiles) {
    stats.stopped = true;
    return;
  }

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (stats.stopped || stats.fileCount >= maxFiles) {
        stats.stopped = true;
        return;
      }

      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Calculate size for major directories
        if (MAJOR_DIRS.includes(entry.name) || entry.name.toLowerCase().includes('wawapp')) {
          try {
            const dirStat = await stat(fullPath);
            stats.dirSizes[entry.name] = await getDirSize(fullPath);
          } catch {
            stats.dirSizes[entry.name] = 0;
          }
        }

        // Recurse if not ignored
        if (!IGNORE_DIRS.has(entry.name)) {
          await walkDirectory(fullPath, maxFiles, stats);
        }
      } else {
        stats.fileCount++;
      }
    }
  } catch {
    // Skip directories we can't read
  }
}

async function getDirSize(dirPath: string): Promise<number> {
  let size = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      try {
        const fileStat = await stat(fullPath);
        if (entry.isFile()) {
          size += fileStat.size;
        } else if (entry.isDirectory()) {
          size += await getDirSize(fullPath);
        }
      } catch {
        // Skip files/dirs we can't access
      }
    }
  } catch {
    // Skip directories we can't read
  }
  return size;
}

export async function getWorkspaceStats(rootPath: string, maxFiles: number = 20000): Promise<WorkspaceStats> {
  const stats = {
    fileCount: 0,
    dirSizes: {} as Record<string, number>,
    stopped: false
  };

  await walkDirectory(rootPath, maxFiles, stats);

  // Calculate complexity score
  const sizeScore = Math.min(stats.fileCount / 1000, 10); // 0-10 based on file count
  const dirSizeScore = Math.min(Object.values(stats.dirSizes).reduce((a, b) => a + b, 0) / (1024 * 1024 * 100), 10); // 0-10 based on total size in 100MB chunks
  
  return {
    totalFiles: stats.fileCount,
    directorySizes: Object.fromEntries(
      Object.entries(stats.dirSizes).map(([name, size]) => [
        name, 
        Math.round(size / (1024 * 1024) * 100) / 100 // Convert to MB
      ])
    ),
    complexityScore: Math.round((sizeScore + dirSizeScore) * 100) / 100,
    scanStopped: stats.stopped,
    scannedFiles: stats.fileCount
  };
}