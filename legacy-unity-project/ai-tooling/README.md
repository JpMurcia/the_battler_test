# AI/Editor tooling used on the Unity project

The Unity project had two Claude Code ↔ Unity Editor MCP bridges installed: **UnityMCP** (`com.coplaydev.unity-mcp`) and **Gerty** (`Packages/com.gerty.editor`, config here). Both are Unity-Editor-specific — they expose tools for manipulating GameObjects, scenes, prefabs, and running C# inside `Unity.exe`. Neither has any equivalent surface in a browser-based React app; there's no "editor" process to bridge into. This folder exists purely as a historical record, not something to wire up here.

- `gerty-unity-agent.md` — the Claude Code subagent definition for driving Gerty.
- `gerty-skill.md` — the skill instructions for the same.

**Security note carried over**: the live Gerty config (`ProjectSettings/GertySettings.asset`) held a plaintext auth token and was deliberately never committed to the Unity repo's git history (see that repo's `.gitignore`). These two files here are just the tool-usage documentation, not the runtime config — no secrets in them.

If a future need arises for something analogous in this repo (e.g. a dev-tooling MCP server for browser/Vite state inspection), these are a reasonable reference for the shape of that kind of integration (local HTTP server, Bearer-token auth, auto-registered via `.mcp.json`) — but nothing here should be copied verbatim.
