interface MachineProfile {
  system: {
    os: any;
    cpu: any;
    memory: any;
    disk: any;
  };
  vscode: {
    version: string;
    amazonQExtension: any;
    settings: any;
  };
  workspace: {
    totalFiles: number;
    directorySizes: Record<string, number>;
    complexityScore: number;
  };
}

interface PerformanceComparison {
  summary: string;
  advantages: string[];
  recommendations: string[];
  details: {
    hardware: string[];
    software: string[];
    workspace: string[];
  };
}

export function analyzePerformanceDifference(
  thisMachine: MachineProfile,
  otherMachine: MachineProfile
): PerformanceComparison {
  const advantages: string[] = [];
  const recommendations: string[] = [];
  const details = { 
    hardware: [] as string[], 
    software: [] as string[], 
    workspace: [] as string[] 
  };

  // Hardware comparison
  if (thisMachine.system.cpu.logicalCores > otherMachine.system.cpu.logicalCores) {
    advantages.push(`More CPU cores (${thisMachine.system.cpu.logicalCores} vs ${otherMachine.system.cpu.logicalCores})`);
    details.hardware.push(`CPU advantage: ${thisMachine.system.cpu.logicalCores - otherMachine.system.cpu.logicalCores} additional cores`);
  } else if (thisMachine.system.cpu.logicalCores < otherMachine.system.cpu.logicalCores) {
    recommendations.push(`Upgrade CPU or use a machine with more cores (currently ${thisMachine.system.cpu.logicalCores} vs ${otherMachine.system.cpu.logicalCores})`);
  }

  if (thisMachine.system.memory.totalGB > otherMachine.system.memory.totalGB) {
    advantages.push(`More RAM (${thisMachine.system.memory.totalGB}GB vs ${otherMachine.system.memory.totalGB}GB)`);
    details.hardware.push(`Memory advantage: ${thisMachine.system.memory.totalGB - otherMachine.system.memory.totalGB}GB additional RAM`);
  } else if (thisMachine.system.memory.totalGB < otherMachine.system.memory.totalGB) {
    recommendations.push(`Add more RAM (currently ${thisMachine.system.memory.totalGB}GB vs ${otherMachine.system.memory.totalGB}GB)`);
  }

  // Disk type comparison
  const thisSSD = thisMachine.system.disk.drives.some((d: any) => d.type === 'SSD');
  const otherSSD = otherMachine.system.disk.drives.some((d: any) => d.type === 'SSD');
  
  if (thisSSD && !otherSSD) {
    advantages.push('SSD storage vs HDD');
    details.hardware.push('SSD provides significantly faster file I/O for indexing and compilation');
  } else if (!thisSSD && otherSSD) {
    recommendations.push('Upgrade to SSD storage for faster file operations');
  }

  // VS Code version comparison
  const thisVSCode = parseVersion(thisMachine.vscode.version);
  const otherVSCode = parseVersion(otherMachine.vscode.version);
  
  if (thisVSCode > otherVSCode) {
    advantages.push(`Newer VS Code version (${thisMachine.vscode.version} vs ${otherMachine.vscode.version})`);
    details.software.push('Newer VS Code versions often include performance improvements');
  } else if (thisVSCode < otherVSCode) {
    recommendations.push(`Update VS Code to latest version (currently ${thisMachine.vscode.version})`);
  }

  // Amazon Q extension comparison
  if (thisMachine.vscode.amazonQExtension.installed && !otherMachine.vscode.amazonQExtension.installed) {
    details.software.push('Amazon Q extension is properly installed');
  } else if (!thisMachine.vscode.amazonQExtension.installed && otherMachine.vscode.amazonQExtension.installed) {
    recommendations.push('Install Amazon Q extension');
  }

  // Workspace complexity comparison
  if (thisMachine.workspace.totalFiles < otherMachine.workspace.totalFiles) {
    advantages.push(`Fewer files to index (${thisMachine.workspace.totalFiles} vs ${otherMachine.workspace.totalFiles})`);
    details.workspace.push(`${otherMachine.workspace.totalFiles - thisMachine.workspace.totalFiles} fewer files to process`);
  } else if (thisMachine.workspace.totalFiles > otherMachine.workspace.totalFiles) {
    recommendations.push('Consider cleaning up unused files or using .gitignore to exclude build artifacts');
  }

  if (thisMachine.workspace.complexityScore < otherMachine.workspace.complexityScore) {
    advantages.push(`Lower workspace complexity (${thisMachine.workspace.complexityScore} vs ${otherMachine.workspace.complexityScore})`);
    details.workspace.push('Simpler workspace structure reduces indexing overhead');
  }

  // Check for large directories
  const thisNodeModules = thisMachine.workspace.directorySizes['node_modules'] || 0;
  const otherNodeModules = otherMachine.workspace.directorySizes['node_modules'] || 0;
  
  if (thisNodeModules < otherNodeModules) {
    advantages.push(`Smaller node_modules (${thisNodeModules}MB vs ${otherNodeModules}MB)`);
  } else if (thisNodeModules > otherNodeModules) {
    recommendations.push('Clean up node_modules or exclude from VS Code indexing');
  }

  const summary = advantages.length > 0 
    ? `This machine is faster due to: ${advantages.join(', ')}`
    : 'No clear hardware/software advantages detected. Performance differences may be due to other factors.';

  return {
    summary,
    advantages,
    recommendations,
    details
  };
}

function parseVersion(version: string): number {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return 0;
  
  const [, major, minor, patch] = match;
  return parseInt(major) * 10000 + parseInt(minor) * 100 + parseInt(patch);
}