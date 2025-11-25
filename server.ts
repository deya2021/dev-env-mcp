#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { getDevEnvOverview } from './tools/dev_env_overview.js';
import { getPathInspection } from './tools/path_inspector.js';
import { checkWawAppEnv } from './tools/wawapp_env_check.js';
import { readVSCodeSettings, getAmazonQSettings, getClaudeCodeSettings } from './tools/settings_reader.js';
import { getExtensionInfo } from './tools/extension_info.js';
import { getExtensionLogs } from './tools/log_reader.js';
import { runProjectDoctor } from './tools/project_doctor.js';

const SERVER_NAME = 'dev-env-inspector-mcp';
const SERVER_VERSION = '1.0.0';

// Define all available tools
const tools: Tool[] = [
  {
    name: 'dev_env_overview',
    description: 'Get comprehensive system information including OS, CPU, memory, and disk details',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'path_inspector',
    description: 'Inspect environment variables including PATH, JAVA_HOME, ANDROID_HOME, etc.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'wawapp_env_check',
    description: 'Check versions of all development tools (Flutter, Dart, Java, Gradle, Firebase, Node, npm, git, VS Code)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'settings_reader',
    description: 'Read and merge VS Code user settings and workspace settings',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceDir: {
          type: 'string',
          description: 'Optional workspace directory path (defaults to current directory)'
        }
      },
      required: []
    }
  },
  {
    name: 'amazonq_settings',
    description: 'Get Amazon Q specific settings from VS Code configuration',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceDir: {
          type: 'string',
          description: 'Optional workspace directory path (defaults to current directory)'
        }
      },
      required: []
    }
  },
  {
    name: 'claude_settings',
    description: 'Get Claude Code specific settings from VS Code configuration',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceDir: {
          type: 'string',
          description: 'Optional workspace directory path (defaults to current directory)'
        }
      },
      required: []
    }
  },
  {
    name: 'extension_info',
    description: 'List all VS Code extensions with versions and metadata for key extensions (Amazon Q, Claude Code, Flutter, Dart)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'log_reader',
    description: 'Read recent logs from Amazon Q and Claude Code extensions',
    inputSchema: {
      type: 'object',
      properties: {
        includeContent: {
          type: 'boolean',
          description: 'Include log file contents (default: true)',
          default: true
        },
        maxFiles: {
          type: 'number',
          description: 'Maximum number of log files to read per extension (default: 5)',
          default: 5
        },
        maxSizePerFile: {
          type: 'number',
          description: 'Maximum size in bytes to read per log file (default: 50000)',
          default: 50000
        }
      },
      required: []
    }
  },
  {
    name: 'project_doctor',
    description: 'Run WawApp project diagnostics (tools/doctor.ps1 and tools/diagnose.ps1) if in a WawApp project',
    inputSchema: {
      type: 'object',
      properties: {
        customDir: {
          type: 'string',
          description: 'Optional custom directory to check (defaults to current directory)'
        }
      },
      required: []
    }
  }
];

// Create server instance
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'dev_env_overview': {
        const result = await getDevEnvOverview();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'path_inspector': {
        const result = getPathInspection();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'wawapp_env_check': {
        const result = await checkWawAppEnv();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'settings_reader': {
        const workspaceDir = args?.workspaceDir as string | undefined;
        const result = await readVSCodeSettings(workspaceDir);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'amazonq_settings': {
        const workspaceDir = args?.workspaceDir as string | undefined;
        const result = await getAmazonQSettings(workspaceDir);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'claude_settings': {
        const workspaceDir = args?.workspaceDir as string | undefined;
        const result = await getClaudeCodeSettings(workspaceDir);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'extension_info': {
        const result = await getExtensionInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'log_reader': {
        const options = {
          includeContent: args?.includeContent as boolean | undefined,
          maxFiles: args?.maxFiles as number | undefined,
          maxSizePerFile: args?.maxSizePerFile as number | undefined
        };
        const result = await getExtensionLogs(options);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'project_doctor': {
        const customDir = args?.customDir as string | undefined;
        const result = await runProjectDoctor(customDir);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            stack: error.stack
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP communication
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
