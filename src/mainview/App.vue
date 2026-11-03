<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import type {ChatDelta, ChatDone, Message, Session} from '../shared/rpc'
import {api, rpc} from './rpc'
import SessionSidebar from './components/SessionSidebar.vue'
import ChatPane from './components/ChatPane.vue'
import ContextPanel from './components/ContextPanel.vue'

const sessions = ref<Session[]>([])
const currentId = ref<number | null>(null)
const messages = ref<Message[]>([])
const attachment = ref('')
const panelOpen = ref(true)
const clock = ref('--:--:--')
const chat = ref<InstanceType<typeof ChatPane> | null>(null)

const title = computed(() => sessions.value.find(s => s.id === currentId.value)?.title ?? 'New chat')
const busy = computed(() => messages.value.some(m => m.streaming))

async function loadSessions() {
  sessions.value = await api.listSessions()
}

async function select(id: number) {
  currentId.value = id
  messages.value = await api.getMessages({sessionId: id})
  chat.value?.focus()
}

async function create() {
  // Reuse an empty chat instead of piling up blank ones.
  const empty = sessions.value.find(s => s.title === 'New chat')
  const s = empty ?? (await api.createSession())
  await loadSessions()
  await select(s.id)
}

async function remove(id: number) {
  await api.deleteSession({id})
  await loadSessions()
  if (id === currentId.value) {
    if (sessions.value.length) await select(sessions.value[0].id)
    else await create()
  }
}

async function send(text: string) {
  if (currentId.value === null) return
  const body = attachment.value ? `${text}\n\n[attached: ${attachment.value}]` : text
  attachment.value = ''
  const added = await api.sendMessage({sessionId: currentId.value, text: body})
  messages.value.push(...added)
}

async function attach() {
  attachment.value = (await api.pickFile()) || attachment.value
}

// Messages pushed from the Bun process
rpc.addMessageListener('chatDelta', (d: ChatDelta) => {
  if (d.sessionId !== currentId.value) return
  const m = messages.value.find(m => m.id === d.messageId)
  if (m) m.content += d.delta
})
rpc.addMessageListener('chatDone', (d: ChatDone) => {
  if (d.sessionId !== currentId.value) return
  const m = messages.value.find(m => m.id === d.messageId)
  if (m) m.streaming = false
})
rpc.addMessageListener('sessionsChanged', loadSessions)
rpc.addMessageListener('clock', (t: string) => (clock.value = t))

onMounted(create)
</script>

<template>
  <div class="flex h-full">
    <SessionSidebar :current-id="currentId" :sessions="sessions" @create="create" @remove="remove" @select="select"/>
    <ChatPane
      ref="chat"
      :attachment="attachment"
      :busy="busy"
      :messages="messages"
      :panel-open="panelOpen"
      :title="title"
      @attach="attach"
      @send="send"
      @clear-attachment="attachment = ''"
      @toggle-panel="panelOpen = !panelOpen"
    />
    <ContextPanel v-if="panelOpen" :clock="clock" :message-count="messages.length"/>
  </div>
</template>
