# Amazon Q Performance Analysis MCP Server

A focused MCP server that analyzes your local development environment to explain why Amazon Q Developer performs differently across machines.

## Architecture

The server is organized into 3 focused kits:

### Kit: env-hardware
- `devenv_system_info` - Collects OS, CPU, RAM, and disk information using PowerShell

### Kit: env-vscode  
- `devenv_vscode_info` - Gets VS Code version, Amazon Q extension info, and settings
- `devenv_workspace_stats` - Analyzes workspace file count, directory sizes, and complexity

### Kit: env-amazonq-logs
- `devenv_amazonq_logs_scan` - Scans Amazon Q logs for performance issues
- `devenv_amazonq_perf_summary` - Compares two machine profiles and explains differences

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the server:
```bash
npm run build
```

3. Start the server:
```bash
npm start
```

## Usage with Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "dev-env-perf": {
      "command": "node",
      "args": ["C:\\Users\\user\\Music\\dev-env-mcp\\dist\\server.js"]
    }
  }
}
```

## Example Usage

### 1. Capture This Machine's Profile

```
Please run these tools to capture my machine's profile:
1. devenv_system_info
2. devenv_vscode_info  
3. devenv_workspace_stats with rootPath "C:\Users\user\Music\WawApp"
```

### 2. Scan Amazon Q Logs

```
Run devenv_amazonq_logs_scan with logRoot "C:\Users\user\AppData\Roaming\Code\User\workspaceStorage"
```

### 3. Compare with Another Machine

```
Use devenv_amazonq_perf_summary to compare this machine's profile with another machine's data:
- thisMachine: [paste the JSON from steps 1-2]
- otherMachine: [paste the other machine's JSON]
```

## Tool Details

- **devenv_system_info**: Uses PowerShell to get hardware specs
- **devenv_vscode_info**: Checks VS Code version and Amazon Q extension status
- **devenv_workspace_stats**: Recursively analyzes workspace complexity (respects maxFiles limit)
- **devenv_amazonq_logs_scan**: Searches for Amazon Q logs and analyzes performance patterns
- **devenv_amazonq_perf_summary**: Pure analysis tool that compares machine profiles

## Development

- `npm run watch` - Build in watch mode
- `npm run build` - One-time build
- `npm start` - Run the built server