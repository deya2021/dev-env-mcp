import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

interface LogScanResult {
  scannedFiles: string[];
  totalFiles: number;
  warningCount: number;
  errorCount: number;
  performanceIssues: string[];
  summary: string;
}

const PERFORMANCE_KEYWORDS = [
  'slow', 'latency', 'timeout', 'delay', 'performance',
  'workspace indexing', 'indexing', 'telemetry',
  'memory', 'cpu', 'hang', 'freeze'
];

async function findLogFiles(rootPath: string): Promise<string[]> {
  const logFiles: string[] = [];
  
  async function scan(dirPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          const fileName = entry.name.toLowerCase();
          const dirName = dirPath.toLowerCase();
          
          if (
            fileName.includes('amazon-q') || 
            fileName.includes('lserver') ||
            dirName.includes('amazon-q') ||
            fileName.endsWith('.log')
          ) {
            logFiles.push(fullPath);
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }
  
  await scan(rootPath);
  return logFiles;
}

async function analyzeLogFile(filePath: string): Promise<{
  warnings: number;
  errors: number;
  performanceLines: string[];
}> {
  try {
    const fileStat = await stat(filePath);
    const maxSize = 256 * 1024; // 256KB
    
    let content: string;
    if (fileStat.size > maxSize) {
      // Read last 256KB
      const buffer = Buffer.alloc(maxSize);
      const fs = await import('fs');
      const fd = await fs.promises.open(filePath, 'r');
      await fd.read(buffer, 0, maxSize, Math.max(0, fileStat.size - maxSize));
      await fd.close();
      content = buffer.toString('utf-8');
    } else {
      content = await readFile(filePath, 'utf-8');
    }

    const lines = content.split('\n');
    let warnings = 0;
    let errors = 0;
    const performanceLines: string[] = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('warn')) warnings++;
      if (lowerLine.includes('error')) errors++;
      
      for (const keyword of PERFORMANCE_KEYWORDS) {
        if (lowerLine.includes(keyword)) {
          performanceLines.push(line.trim());
          break;
        }
      }
    }

    return { warnings, errors, performanceLines: performanceLines.slice(-10) }; // Last 10 performance-related lines
  } catch {
    return { warnings: 0, errors: 0, performanceLines: [] };
  }
}

export async function scanAmazonQLogs(logRoot: string): Promise<LogScanResult> {
  const logFiles = await findLogFiles(logRoot);
  
  let totalWarnings = 0;
  let totalErrors = 0;
  const allPerformanceIssues: string[] = [];
  const scannedFiles: string[] = [];

  for (const logFile of logFiles.slice(0, 20)) { // Limit to 20 files
    const analysis = await analyzeLogFile(logFile);
    totalWarnings += analysis.warnings;
    totalErrors += analysis.errors;
    allPerformanceIssues.push(...analysis.performanceLines);
    scannedFiles.push(logFile);
  }

  const summary = `Scanned ${scannedFiles.length} log files. Found ${totalWarnings} warnings, ${totalErrors} errors, and ${allPerformanceIssues.length} performance-related entries.`;

  return {
    scannedFiles,
    totalFiles: logFiles.length,
    warningCount: totalWarnings,
    errorCount: totalErrors,
    performanceIssues: allPerformanceIssues.slice(-20), // Last 20 performance issues
    summary
  };
}