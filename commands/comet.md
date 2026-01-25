# /comet - Browser Automation with Perplexity Comet

You are now in Comet Browser automation mode. You will connect to the user's running Comet browser and automate tasks using their existing sessions, logins, and cookies.

## How It Works

You connect to Comet via Chrome DevTools Protocol (CDP) on port 9222. This gives you access to the user's actual browser with all their logged-in sessions.

## Step 1: Check Connection Status

First, ALWAYS run this to check if the browser is accessible:

```bash
node "$HOME/.claude/scripts/comet-bridge.js" status
```

**If connected:** Proceed with the task.

**If NOT connected (NO_DEBUG_PORT error):** The user needs to launch Comet with debugging enabled. Tell them:

> "Your Comet browser isn't running with debugging enabled. I need you to either:
> 1. Close Comet and run: `powershell -File "$env:USERPROFILE\.claude\scripts\launch-comet-debug.ps1"`
> 2. Or restart Comet manually with: `comet.exe --remote-debugging-port=9222`
>
> Once done, let me know and I'll continue."

## Step 2: Execute Commands

Use the comet-bridge.js script via Bash for all browser interactions:

| Action | Command |
|--------|---------|
| Check status | `node "$HOME/.claude/scripts/comet-bridge.js" status` |
| List open tabs | `node "$HOME/.claude/scripts/comet-bridge.js" pages` |
| Open new tab | `node "$HOME/.claude/scripts/comet-bridge.js" newtab "https://url.com"` |
| Navigate current tab | `node "$HOME/.claude/scripts/comet-bridge.js" navigate "https://url.com"` |
| Take screenshot | `node "$HOME/.claude/scripts/comet-bridge.js" screenshot` |
| Click element | `node "$HOME/.claude/scripts/comet-bridge.js" click "css-selector"` |
| Fill input | `node "$HOME/.claude/scripts/comet-bridge.js" fill "css-selector" "text value"` |
| Run JavaScript | `node "$HOME/.claude/scripts/comet-bridge.js" eval "document.title"` |
| Get page HTML | `node "$HOME/.claude/scripts/comet-bridge.js" html` |
| Switch to tab | `node "$HOME/.claude/scripts/comet-bridge.js" select 0` |

All commands return JSON. Parse the response to determine success/failure.

## Login Handling

If you encounter a login page where the user has saved credentials:
1. Look for the password field (usually already populated or auto-fillable)
2. **ASK the user:** "I see a login page. Do you want me to proceed with your saved credentials? (yes/no)"
3. Only click the login/submit button after user confirms

## Workflow Tips

1. **Always screenshot first** when landing on a new page to understand the layout
2. **Use `pages` command** to see what tabs are already open - user may have relevant pages loaded
3. **Prefer new tabs** (`newtab`) over navigating existing tabs to preserve user's work
4. **Parse JSON responses** - every command returns structured data

## User's Task

$ARGUMENTS
