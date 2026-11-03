import { Electroview } from "electrobun/view";
import type { AppRPC } from "../shared/rpc";

// Webview side of the RPC channel. `api` calls Bun request handlers and
// `rpc.addMessageListener` receives messages that Bun pushes.
export const rpc = Electroview.defineRPC<AppRPC>({
	// The file dialog waits for the user, so allow long-running requests.
	maxRequestTime: 10 * 60 * 1000,
	handlers: { requests: {}, messages: {} },
});

new Electroview({ rpc });

export const api = rpc.request;
