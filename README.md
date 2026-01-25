# Claude Code - Comet Browser Automation

Control your Perplexity Comet browser directly from Claude Code using CDP (Chrome DevTools Protocol). Automate tasks with your existing sessions, logins, and cookies.

## Installation

1. **Copy files to your Claude Code directory:**
   ```bash
   # Copy the commands folder
   cp -r commands/* ~/.claude/commands/

   # Copy the scripts folder
   cp -r scripts/* ~/.claude/scripts/
   ```

2. **Install dependencies:**
   ```bash
   cd ~/.claude/scripts
   npm install
   ```

3. **Verify installation:**
   ```bash
   node ~/.claude/scripts/comet-bridge.js status
   ```

## Usage

### Launch Comet with debugging enabled

**Option 1: Use the launcher script**
```powershell
powershell -File "$env:USERPROFILE\.claude\scripts\launch-comet-debug.ps1"
```

**Option 2: Manual launch**
```bash
comet.exe --remote-debugging-port=9222
```

### Use the /comet command in Claude Code

```
/comet navigate to slack and DM @bryan "Hey, check this out"
```

## Available Commands

The comet-bridge.js script supports:

| Command | Description |
|---------|-------------|
| `status` | Check browser connection |
| `pages` | List all open tabs |
| `newtab <url>` | Open new tab |
| `navigate <url>` | Navigate current tab |
| `screenshot` | Take screenshot |
| `click <selector>` | Click element |
| `fill <selector> <value>` | Fill input field |
| `eval <script>` | Run JavaScript |
| `html` | Get page HTML |
| `select <index>` | Switch to tab |

## Requirements

- Perplexity Comet browser installed
- Node.js (tested with v20+)
- Claude Code

## How It Works

1. Comet launches with `--remote-debugging-port=9222`
2. Claude Code connects via CDP
3. Full browser automation with your existing sessions

No need to log in again - uses your saved credentials and cookies.

## Troubleshooting

**"Browser not connected" error:**
- Make sure Comet is running with debugging enabled
- Check port 9222 isn't blocked by firewall
- Try closing and relaunching Comet

**"No page found" error:**
- Open at least one tab in Comet
- Some commands require an active page

## Security Note

Port 9222 only listens on localhost (127.0.0.1) and is not accessible from the network.
