# learn-electrobun

A tiny desktop chat app for learning [Electrobun](https://electrobun.dev) 2.x: a Bun main process with a Vue 3 + TypeScript + Tailwind CSS webview, so the whole app is TypeScript.

It is a port of [learn-wails](https://github.com/hehuan2112/learn-wails), which builds the same app with Go and Wails.
The UI has three columns (chat history, conversation, context panel) in a borderless window.
Replies come from a mock in the Bun process and stream word by word, so no API key is needed.

## What it demonstrates

1. **Typed RPC**: `src/shared/rpc.ts` defines one `AppRPC` schema that both sides import, so there is no binding generation step (Wails generates `wailsjs/` from Go instead).
2. **Requests from the webview**: the UI calls `api.sendMessage(...)`, `api.listTodos()` and so on, which run the handlers in `src/bun/index.ts`; a thrown error rejects the promise.
3. **Messages from Bun**: chat replies stream through `chatDelta` / `chatDone` messages and a timer sends `clock` every second via `webview.rpc.send.*`; the UI listens with `rpc.addMessageListener`.
4. **Native APIs**: the paperclip button calls `Utils.openFileDialog` in the Bun process.
5. **Borderless window**: `titleBarStyle: "hiddenInset"` hides the title bar, and elements with the `electrobun-webkit-app-region-drag` class let you move the window.

## Requirements

- [Bun](https://bun.sh)
- Hutch, Electrobun's toolchain (installed on first use of `npx electrobun` / `bunx electrobun`, or from https://hutch.blackboard.sh)

Hutch downloads the exact Electrobun runtime and SDK pinned in `hutch.config.ts` into `.hutch/devkit`.

## Develop

```bash
hutch install
hutch run start
```

`hutch run dev` rebuilds on file changes, and `hutch run dev:hmr` adds Vite hot reload for the UI.
The dev build loads the UI from http://localhost:5173 if anything is listening there, so stop other Vite servers first.

## Build

```bash
hutch run build
```

Output goes to `build/` and release artifacts to `artifacts/`.

## Layout

- `src/bun/index.ts`: window options, RPC handlers, and messages pushed to the UI
- `src/bun/state.ts`: in-memory sessions, messages, tasks, and the streamed mock reply
- `src/shared/rpc.ts`: types and the RPC schema shared by both sides
- `src/mainview/rpc.ts`: the webview side of the RPC channel
- `src/mainview/App.vue`: layout and chat state
- `src/mainview/components/`: `SessionSidebar`, `ChatPane`, `ContextPanel`
- `src/mainview/app.css`: Tailwind import and light/dark theme colors
