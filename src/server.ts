#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tools } from './server/tool-registry.js';
import { getSystemInfo } from './kits/env-hardware/system-info.js';
import { getVSCodeInfo } from './kits/env-vscode/vscode-info.js';
import { getWorkspaceStats } from './kits/env-vscode/workspace-stats.js';
import { scanAmazonQLogs } from './kits/env-amazonq-logs/log-scanner.js';
import { analyzePerformanceDifference } from './kits/env-amazonq-logs/perf-analyzer.js';

const SERVER_NAME = 'dev-env-amazonq-perf';
const SERVER_VERSION = '1.0.0';

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

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'devenv_system_info': {
        const result = await getSystemInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'devenv_vscode_info': {
        const result = await getVSCodeInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'devenv_workspace_stats': {
        const rootPath = args?.rootPath as string;
        const maxFiles = (args?.maxFiles as number) || 20000;
        const result = await getWorkspaceStats(rootPath, maxFiles);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'devenv_amazonq_logs_scan': {
        const logRoot = args?.logRoot as string;
        const result = await scanAmazonQLogs(logRoot);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'devenv_amazonq_perf_summary': {
        const thisMachine = args?.thisMachine as any;
        const otherMachine = args?.otherMachine as any;
        const result = analyzePerformanceDifference(thisMachine, otherMachine);
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});