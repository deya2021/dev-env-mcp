# Dev Env Inspector MCP

A universal multi-platform Model Context Protocol (MCP) server that provides comprehensive analysis of your development environment, installed tools, VS Code configuration, and project-specific diagnostics.

## Features

This MCP server provides the following diagnostic tools:

### 1. **dev_env_overview**
Provides comprehensive system information:
- Operating system details (platform, release, version, architecture)
- CPU information (model, core count)
- Memory statistics (total and free RAM)
- Disk information (type: SSD/HDD, free space, total space)

### 2. **path_inspector**
Inspects environment variables:
- PATH variable (parsed into array)
- JAVA_HOME
- ANDROID_HOME
- GRADLE_HOME
- FLUTTER_HOME
- DART_HOME
- NODE_HOME
- PYTHON_HOME
- All environment variables

### 3. **wawapp_env_check**
Checks versions of development tools:
- Flutter
- Dart
- Java
- Gradle
- Firebase CLI
- Node.js
- npm
- Git
- VS Code

### 4. **settings_reader**
Reads and merges VS Code settings:
- User settings (`%APPDATA%/Code/User/settings.json`)
- Workspace settings (`.vscode/settings.json`)
- Returns merged configuration

### 5. **amazonq_settings**
Extracts Amazon Q specific settings from VS Code configuration.

### 6. **claude_settings**
Extracts Claude Code specific settings from VS Code configuration.

### 7. **extension_info**
Lists all installed VS Code extensions with:
- Extension ID and version
- Total extension count
- Specific detection for Amazon Q, Claude Code, Flutter, and Dart extensions
- Extension metadata

### 8. **log_reader**
Reads recent logs from:
- Amazon Q extension
- Claude Code extension
- Configurable: number of files, file size limit, include content

### 9. **project_doctor**
For WawApp projects, runs diagnostic scripts:
- `tools/doctor.ps1`
- `tools/diagnose.ps1`
- Automatically detects WawApp project root

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- VS Code (for extension-related tools)

### Steps

1. Clone or download this repository:
```bash
cd C:\Users\user\Music\dev-env-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### Registering with Claude Code (VS Code Extension)

To use this MCP server with Claude Code in VS Code, add it to your VS Code settings:

1. Open VS Code settings (File > Preferences > Settings or `Ctrl+,`)
2. Search for "MCP" or navigate to Claude Code settings
3. Edit your `settings.json` (click the "Edit in settings.json" button)
4. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "dev-env-inspector": {
      "command": "node",
      "args": ["C:\\Users\\user\\Music\\dev-env-mcp\\dist\\server.js"],
      "env": {}
    }
  }
}
```

### Registering with Amazon Q or Other MCP Clients

For Amazon Q or other MCP-compatible clients, configure according to their documentation. The basic configuration is:

```json
{
  "mcpServers": {
    "dev-env-inspector": {
      "command": "node",
      "args": ["/absolute/path/to/dev-env-mcp/dist/server.js"]
    }
  }
}
```

### Alternative: Global Registration

You can also register the MCP server globally in your MCP client's configuration file (usually `~/.mcp/servers.json` or similar):

```json
{
  "dev-env-inspector": {
    "command": "node",
    "args": ["C:\\Users\\user\\Music\\dev-env-mcp\\dist\\server.js"],
    "description": "Development environment inspector and diagnostics"
  }
}
```

## Usage

Once registered, the MCP server will automatically start when your MCP client (Claude Code, Amazon Q, etc.) initializes.

You can then invoke any of the tools through your MCP client:

### Example Tool Invocations

**Get system overview:**
```
Use the dev_env_overview tool
```

**Check development tools:**
```
Use the wawapp_env_check tool to see all installed development tools
```

**Read VS Code settings:**
```
Use the settings_reader tool
```

**Get extension information:**
```
Use the extension_info tool
```

**Read recent logs:**
```
Use the log_reader tool with maxFiles=3 and includeContent=true
```

**Run project diagnostics:**
```
Use the project_doctor tool
```

## Development

### Project Structure

```
dev-env-mcp/
├── package.json          # Node.js package configuration
├── tsconfig.json         # TypeScript configuration
├── server.ts             # Main MCP server implementation
├── tools/                # Tool implementations
│   ├── dev_env_overview.ts
│   ├── path_inspector.ts
│   ├── wawapp_env_check.ts
│   ├── settings_reader.ts
│   ├── extension_info.ts
│   ├── log_reader.ts
│   └── project_doctor.ts
├── dist/                 # Compiled JavaScript (generated)
└── README.md            # This file
```

### Build Commands

- **Build once:** `npm run build`
- **Watch mode:** `npm run watch`
- **Run directly:** `npm start`

### Adding New Tools

1. Create a new file in `tools/` directory
2. Export your tool function
3. Import it in `server.ts`
4. Add tool definition to the `tools` array
5. Add a case in the `CallToolRequestSchema` handler
6. Rebuild: `npm run build`

## Platform Support

This MCP server is designed to work on:
- **Windows** (primary platform)
- **macOS** (supported)
- **Linux** (supported)

Some platform-specific features may behave differently:
- Disk type detection uses PowerShell on Windows
- Path separators differ (`;` on Windows, `:` on Unix)
- VS Code settings paths vary by platform

## Troubleshooting

### Server doesn't start
- Check that Node.js >= 18.0.0 is installed: `node --version`
- Verify build succeeded: check `dist/` directory exists
- Check MCP client logs for error messages

### Tools return errors
- Verify the tool/command exists on your system (e.g., `flutter --version`)
- Check environment variables (PATH, JAVA_HOME, etc.)
- Some tools gracefully fail if not available

### VS Code settings not found
- Verify VS Code is installed
- Check settings path for your platform
- Ensure you have user settings created (open VS Code settings once)

### WawApp project_doctor not working
- Verify you're in a WawApp project (has `tools/doctor.ps1`)
- Ensure PowerShell is available and not blocked by execution policy
- Check script permissions

## License

MIT

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues, questions, or feature requests, please open an issue in the repository.
