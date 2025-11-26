# How to Use the Amazon Q Performance Analysis MCP Server

## Quick Start

1. **Build and start the server:**
```bash
cd C:\Users\user\Music\dev-env-mcp
npm run build
npm start
```

2. **Add to Claude Desktop MCP config** (`%APPDATA%\Claude\claude_desktop_config.json`):
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

## Step-by-Step Usage

### Phase 1: Capture This Machine's Environment Profile

Send this prompt to Claude:

```
I want to analyze why Amazon Q is faster on this machine. Please run these tools to capture my environment:

1. devenv_system_info - Get my hardware specs
2. devenv_vscode_info - Check VS Code and Amazon Q extension 
3. devenv_workspace_stats with rootPath "C:\Users\user\Music\WawApp" - Analyze my WawApp workspace
```

Save the JSON results from all three tools.

### Phase 2: Scan Amazon Q Logs (Optional)

```
Please scan my Amazon Q logs for performance issues:

devenv_amazonq_logs_scan with logRoot "C:\Users\user\AppData\Roaming\Code\User\workspaceStorage"
```

### Phase 3: Compare with Slower Machine

When you have data from the slower machine, use:

```
Please compare my machine with the slower one using devenv_amazonq_perf_summary:

thisMachine: {
  "system": [paste system info from Phase 1],
  "vscode": [paste vscode info from Phase 1], 
  "workspace": [paste workspace stats from Phase 1]
}

otherMachine: {
  [paste the other machine's equivalent data]
}
```

## Expected Output

The server will provide:
- **Hardware comparison**: CPU cores, RAM, SSD vs HDD
- **Software comparison**: VS Code versions, extension status
- **Workspace comparison**: File counts, complexity scores
- **Specific recommendations**: Actionable steps to improve the slower machine

## Tool Reference

- `devenv_system_info` - PowerShell-based hardware detection
- `devenv_vscode_info` - VS Code and Amazon Q extension analysis  
- `devenv_workspace_stats` - Workspace complexity analysis
- `devenv_amazonq_logs_scan` - Log file performance issue detection
- `devenv_amazonq_perf_summary` - Machine comparison and recommendations