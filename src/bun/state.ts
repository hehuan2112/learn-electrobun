import type { ChatDelta, ChatDone, Message, Session, Todo } from "../shared/rpc";

// In-memory app state that lives in the Bun process (the Wails version kept it in Go).

export type Events = {
	chatDelta: (d: ChatDelta) => void;
	chatDone: (d: ChatDone) => void;
	sessionsChanged: () => void;
};

let nextId = 1;
const todos: Todo[] = [];
const sessions: Session[] = [];
const messages = new Map<number, Message[]>();

const now = () => new Date().toTimeString().slice(0, 5);
const truncate = (s: string, n: number) => ([...s].length <= n ? s : [...s].slice(0, n).join("") + "…");

// ---- Tasks ----

export function listTodos(): Todo[] {
	return todos.map((t) => ({ ...t }));
}

export function addTodo(title: string): Todo {
	title = title.trim();
	// A thrown error rejects the webview's request promise.
	if (!title) throw new Error("title cannot be empty");
	const t = { id: nextId++, title, done: false };
	todos.push(t);
	return t;
}

export function toggleTodo(id: number) {
	const t = todos.find((t) => t.id === id);
	if (!t) throw new Error(`todo ${id} not found`);
	t.done = !t.done;
}

export function deleteTodo(id: number) {
	const i = todos.findIndex((t) => t.id === id);
	if (i >= 0) todos.splice(i, 1);
}

// ---- Chat ----

export function listSessions(): Session[] {
	return [...sessions].reverse();
}

export function createSession(): Session {
	const s = { id: nextId++, title: "New chat", updatedAt: now() };
	sessions.push(s);
	messages.set(s.id, []);
	return s;
}

export function deleteSession(id: number) {
	const i = sessions.findIndex((s) => s.id === id);
	if (i >= 0) sessions.splice(i, 1);
	messages.delete(id);
}

export function getMessages(sessionId: number): Message[] {
	return (messages.get(sessionId) ?? []).map((m) => ({ ...m }));
}

// Stores the user's message and starts streaming a reply.
// It returns right away; the reply arrives through chatDelta / chatDone messages.
export function sendMessage(sessionId: number, text: string, events: Events): Message[] {
	text = text.trim();
	if (!text) throw new Error("message cannot be empty");
	const session = sessions.find((s) => s.id === sessionId);
	if (!session) throw new Error(`session ${sessionId} not found`);

	const user: Message = { id: nextId++, role: "user", content: text, streaming: false };
	const reply: Message = { id: nextId++, role: "assistant", content: "", streaming: true };
	messages.get(sessionId)!.push(user, reply);
	if (session.title === "New chat") session.title = truncate(text, 40);
	session.updatedAt = now();

	events.sessionsChanged();
	void streamReply(sessionId, reply, text, events);
	return [{ ...user }, { ...reply }];
}

// Fakes a model by sending a canned answer word by word.
// Swap this out for a real LLM API call to make it a working chat client.
async function streamReply(sessionId: number, reply: Message, prompt: string, events: Events) {
	const answer =
		`You said: ${JSON.stringify(prompt)}\n\n` +
		"This reply is generated in the Bun process (src/bun/state.ts) and streamed to the UI " +
		"one word at a time with webview.rpc.send.chatDelta(...). The Vue side listens with " +
		"rpc.addMessageListener and appends each chunk to the message.\n\n" +
		"Try replacing streamReply with a real LLM API call.";

	for (const word of answer.split(/(?<= )/)) {
		await Bun.sleep(35);
		if (!messages.has(sessionId)) return; // session was deleted
		reply.content += word;
		events.chatDelta({ sessionId, messageId: reply.id, delta: word });
	}
	reply.streaming = false;
	events.chatDone({ sessionId, messageId: reply.id });
}
