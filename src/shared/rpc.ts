import type { RPCSchema } from "electrobun/main";

// Types shared by the Bun process and the webview. Because both sides are
// TypeScript, there is no code generation step: they import this file directly.

export type Todo = { id: number; title: string; done: boolean };

export type SystemInfo = {
	os: string;
	arch: string;
	runtime: string;
	cpus: number;
};

export type Session = { id: number; title: string; updatedAt: string };

export type Message = {
	id: number;
	role: "user" | "assistant";
	content: string;
	streaming: boolean;
};

export type ChatDelta = { sessionId: number; messageId: number; delta: string };
export type ChatDone = { sessionId: number; messageId: number };

// Each side lists the requests it answers and the messages it receives.
export type AppRPC = {
	bun: RPCSchema<{
		requests: {
			listSessions: { params: undefined; response: Session[] };
			createSession: { params: undefined; response: Session };
			deleteSession: { params: { id: number }; response: void };
			getMessages: { params: { sessionId: number }; response: Message[] };
			sendMessage: { params: { sessionId: number; text: string }; response: Message[] };
			listTodos: { params: undefined; response: Todo[] };
			addTodo: { params: { title: string }; response: Todo };
			toggleTodo: { params: { id: number }; response: void };
			deleteTodo: { params: { id: number }; response: void };
			getSystemInfo: { params: undefined; response: SystemInfo };
			pickFile: { params: undefined; response: string };
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {
			chatDelta: ChatDelta;
			chatDone: ChatDone;
			sessionsChanged: undefined;
			clock: string;
		};
	}>;
};
