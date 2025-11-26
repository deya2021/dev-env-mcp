import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  // Kit: env-hardware
  {
    name: 'devenv_system_info',
    description: 'Collect system hardware information including OS, CPU, RAM, and disk details using PowerShell',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },

  // Kit: env-vscode
  {
    name: 'devenv_vscode_info',
    description: 'Get VS Code version, Amazon Q extension info, and relevant settings',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'devenv_workspace_stats',
    description: 'Analyze workspace file count, directory sizes, and complexity score',
    inputSchema: {
      type: 'object',
      properties: {
        rootPath: {
          type: 'string',
          description: 'Root path to analyze'
        },
        maxFiles: {
          type: 'number',
          description: 'Maximum files to scan (default: 20000)',
          default: 20000
        }
      },
      required: ['rootPath']
    }
  },

  // Kit: env-amazonq-logs
  {
    name: 'devenv_amazonq_logs_scan',
    description: 'Scan Amazon Q extension logs for performance issues',
    inputSchema: {
      type: 'object',
      properties: {
        logRoot: {
          type: 'string',
          description: 'Root directory to scan for Amazon Q logs'
        }
      },
      required: ['logRoot']
    }
  },
  {
    name: 'devenv_amazonq_perf_summary',
    description: 'Compare two machine profiles and explain performance differences',
    inputSchema: {
      type: 'object',
      properties: {
        thisMachine: {
          type: 'object',
          description: 'Hardware + VS Code + workspace stats from this machine'
        },
        otherMachine: {
          type: 'object',
          description: 'Hardware + VS Code + workspace stats from other machine'
        }
      },
      required: ['thisMachine', 'otherMachine']
    }
  }
];