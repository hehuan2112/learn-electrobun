import { BrowserView, BrowserWindow, Updater, Utils } from "electrobun/main";
import { cpus } from "node:os";
import type { AppRPC } from "../shared/rpc";
import * as state from "./state";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log("Vite dev server not running. Run 'hutch run dev:hmr' for HMR support.");
		}
	}
	return "views://mainview/index.html";
}

// Requests the webview can make. This is the Electrobun counterpart of the
// exported methods on the Wails App struct.
const rpc = BrowserView.defineRPC<AppRPC>({
	// The file dialog waits for the user, so allow long-running requests.
	maxRequestTime: 10 * 60 * 1000,
	handlers: {
		requests: {
			listSessions: () => state.listSessions(),
			createSession: () => state.createSession(),
			deleteSession: ({ id }) => state.deleteSession(id),
			getMessages: ({ sessionId }) => state.getMessages(sessionId),
			sendMessage: ({ sessionId, text }) => state.sendMessage(sessionId, text, events),
			listTodos: () => state.listTodos(),
			addTodo: ({ title }) => state.addTodo(title),
			toggleTodo: ({ id }) => state.toggleTodo(id),
			deleteTodo: ({ id }) => state.deleteTodo(id),
			getSystemInfo: () => ({
				os: process.platform,
				arch: process.arch,
				runtime: `Bun ${Bun.version}`,
				cpus: cpus().length,
			}),
			pickFile: async () => {
				const paths = await Utils.openFileDialog({
					canChooseDirectory: false,
					allowsMultipleSelection: false,
				});
				return paths.find((p) => p !== "") ?? "";
			},
		},
		messages: {},
	},
});

const mainWindow = new BrowserWindow({
	title: "Learn Electrobun",
	url: await getMainViewUrl(),
	frame: { width: 1280, height: 820, x: 120, y: 80 },
	// Borderless look: the web content fills the whole window and only the
	// traffic-light buttons remain. Elements with the
	// `electrobun-webkit-app-region-drag` class move the window.
	titleBarStyle: "hiddenInset",
	rpc,
});

// Messages pushed from Bun to the webview (Wails used runtime.EventsEmit).
const events: state.Events = {
	chatDelta: (d) => mainWindow.webview.rpc?.send.chatDelta(d),
	chatDone: (d) => mainWindow.webview.rpc?.send.chatDone(d),
	sessionsChanged: () => mainWindow.webview.rpc?.send.sessionsChanged(undefined),
};

setInterval(() => {
	mainWindow.webview.rpc?.send.clock(new Date().toTimeString().slice(0, 8));
}, 1000);
