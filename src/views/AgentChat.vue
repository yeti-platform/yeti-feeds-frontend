<template>
  <v-container fluid class="mx-10 mt-3">
    <v-row>
      <v-col>
        <div class="d-flex align-center mb-4">
          <h2 class="mr-4">Agent chat</h2>
          <v-combobox
            v-model="sessionId"
            :items="availableSessions"
            item-title="label"
            item-value="id"
            :return-object="false"
            label="Session ID"
            density="compact"
            variant="outlined"
            hide-details
            class="flex-grow-1"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" class="session-label">
                <template v-if="item.raw.isNew" v-slot:append>
                  <v-chip size="x-small" color="primary" variant="tonal">New</v-chip>
                </template>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <span class="session-label text-truncate">{{ item.title }}</span>
              <v-chip v-if="item.raw.isNew" size="x-small" color="primary" variant="tonal" class="ml-2">New</v-chip>
            </template>
          </v-combobox>
          <v-btn
            color="primary"
            class="ml-2"
            @click="createNewSession"
            prepend-icon="mdi-plus"
          >
            New Session
          </v-btn>
        </div>
        <div class="chat-container mb-4 border rounded-lg" ref="chatContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-wrapper', msg.sender === 'user' ? 'user-message' : 'agent-message']"
          >
            <v-card v-if="msg.sender === 'user'" color="primary" variant="flat" rounded="lg" class="agent-card d-inline-block">
              <v-card-text class="pre-wrap">{{ msg.parts[0]?.type === "text" ? msg.parts[0].text : "" }}</v-card-text>
            </v-card>
            <div v-else class="agent-message-layout">
              <div v-if="msg.parts.length > 0" class="message-parts-container">
                <template v-for="(part, idx) in msg.parts" :key="idx">
                  <v-card v-if="part.type === 'thought'" color="warning" variant="tonal" rounded="lg" class="agent-card">
                    <v-card-item class="py-2 cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <template v-slot:prepend><v-icon size="small">mdi-brain</v-icon></template>
                      <v-card-title class="text-caption font-weight-bold">Thought</v-card-title>
                      <template v-slot:append>
                        <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                      </template>
                    </v-card-item>
                    <v-expand-transition>
                      <v-card-text v-show="!part.collapsed" class="pre-wrap pt-0">{{ part.text }}</v-card-text>
                    </v-expand-transition>
                  </v-card>
                  <v-alert
                    v-else-if="part.type === 'transfer'"
                    type="info"
                    variant="tonal"
                    density="compact"
                    rounded="lg"
                    icon="mdi-swap-horizontal"
                    class="agent-card text-caption font-weight-bold"
                  >
                    Agent transfer: {{ msg.author || 'system' }} &rarr; {{ part.destination || 'unknown agent' }}
                  </v-alert>
                  <v-card v-else-if="part.type === 'functionCall'" color="info" variant="tonal" rounded="lg" class="agent-card">
                    <v-card-item class="py-2 cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <template v-slot:prepend><v-icon size="small">mdi-wrench</v-icon></template>
                      <v-card-title class="text-caption font-weight-bold">Tool Call: {{ part.name }}</v-card-title>
                      <template v-slot:append>
                        <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                      </template>
                    </v-card-item>
                    <v-expand-transition>
                      <v-card-text v-show="!part.collapsed" class="code-block pt-0">{{ JSON.stringify(part.args, null, 2) }}</v-card-text>
                    </v-expand-transition>
                  </v-card>
                  <v-card v-else-if="part.type === 'functionResponse'" color="success" variant="tonal" rounded="lg" class="agent-card">
                    <v-card-item class="py-2 cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <template v-slot:prepend><v-icon size="small">mdi-check-circle-outline</v-icon></template>
                      <v-card-title class="text-caption font-weight-bold">Tool Response: {{ part.name }}</v-card-title>
                      <template v-slot:append>
                        <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                      </template>
                    </v-card-item>
                    <v-expand-transition>
                      <v-card-text v-show="!part.collapsed" class="code-block pt-0">{{ typeof part.response === 'string' ? part.response : JSON.stringify(part.response, null, 2) }}</v-card-text>
                    </v-expand-transition>
                  </v-card>
                  <v-card v-else-if="part.type === 'text'" color="surface-alt" variant="flat" rounded="lg" class="agent-card">
                    <v-card-text class="pre-wrap">{{ part.text }}</v-card-text>
                  </v-card>
                  <v-alert
                    v-else-if="part.type === 'error'"
                    type="error"
                    variant="tonal"
                    rounded="lg"
                    icon="mdi-alert-circle"
                    class="agent-card pre-wrap"
                  >
                    {{ part.text }}
                  </v-alert>
                </template>
              </div>
              <v-card v-if="loading && index === messages.length - 1" color="surface-alt" variant="flat" rounded="lg" class="agent-card">
                <v-card-text class="d-flex align-center py-2">
                  <v-progress-circular indeterminate size="20" width="2"></v-progress-circular>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>

        <v-toolbar color="transparent" flat class="mb-2 px-0">
          <v-spacer></v-spacer>
          <v-btn
            variant="tonal"
            size="small"
            color="primary"
            class="mr-2"
            @click="toggleAllCollapsed"
            :prepend-icon="allCollapsed ? 'mdi-expand-all' : 'mdi-collapse-all'"
          >
            {{ allCollapsed ? 'Expand All' : 'Collapse All' }}
          </v-btn>
            <v-btn
              @click="toggleThoughts"
              :prepend-icon="thoughtsCollapsed ? 'mdi-unfold-more-horizontal' : 'mdi-unfold-less-horizontal'"
              class="mr-2"
              color="primary" variant="outlined" size="small"
            >
              {{ thoughtsCollapsed ? 'Expand Thoughts' : 'Collapse Thoughts' }}
            </v-btn>
            <v-btn
              @click="toggleTools"
              :prepend-icon="toolsCollapsed ? 'mdi-unfold-more-horizontal' : 'mdi-unfold-less-horizontal'"
              class="mr-2"
              color="primary" variant="outlined" size="small"
            >
              {{ toolsCollapsed ? 'Expand Tools' : 'Collapse Tools' }}
            </v-btn>
        </v-toolbar>

        <v-text-field
          v-model="userInput"
          label="Chat with the agent..."
          prepend-inner-icon="mdi-chat"
          variant="outlined"
          :loading="loading"
          :disabled="loading"
          @keyup.enter="sendMessage"
        >
          <template v-slot:append-inner>
            <v-icon @click="sendMessage" color="primary" class="cursor-pointer">mdi-send</v-icon>
          </template>
        </v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import axios from "axios";

type MessagePartType = 'text' | 'thought' | 'functionCall' | 'functionResponse' | 'transfer' | 'error';

interface BaseMessagePart {
  type: MessagePartType;
  collapsed?: boolean;
}

interface TextPart extends BaseMessagePart {
  type: 'text';
  text: string;
}

interface ThoughtPart extends BaseMessagePart {
  type: 'thought';
  text: string;
}

interface FunctionCallPart extends BaseMessagePart {
  type: 'functionCall';
  id: string;
  name: string;
  args: Record<string, any>;
}

interface FunctionResponsePart extends BaseMessagePart {
  type: 'functionResponse';
  id: string;
  name: string;
  response: any;
}

interface TransferPart extends BaseMessagePart {
  type: 'transfer';
  destination: string;
}

interface ErrorPart extends BaseMessagePart {
  type: 'error';
  text: string;
  errorType?: string;
}

type MessagePart = TextPart | ThoughtPart | FunctionCallPart | FunctionResponsePart | TransferPart | ErrorPart;

interface ChatMessage {
  sender: "user" | "agent";
  parts: MessagePart[];
  author?: string;
}

interface AgentEvent {
  author?: string;
  role?: string;
  error?: string;
  error_type?: string;
  actions?: {
    transfer_to_agent?: string;
  };
  content?: {
    parts?: Array<{
      text?: string;
      thought?: boolean;
      function_call?: {
        id: string;
        name: string;
        args: Record<string, any>;
      };
      function_response?: {
        id: string;
        name: string;
        response: any;
      };
    }>;
  };
}

interface ADKSession {
  id: string;
  appName: string;
  userId: string;
  events: AgentEvent[];
  createTime?: number;
}

interface SessionSummary {
  id: string;
  createTime: number;
  label: string;
  isNew: boolean;
}

export default {
  name: "AgentChat",
  data() {
    return {
      userInput: "" as string,
      messages: [] as ChatMessage[],
      loading: false as boolean,
      thoughtsCollapsed: false as boolean,
      toolsCollapsed: false as boolean,
      allCollapsed: false as boolean,
      userId: "yeti",
      sessionId: "session-" + Math.random().toString(36).substring(7),
      availableSessions: [] as SessionSummary[]
    };
  },
  async mounted() {
    await this.fetchSessions();
    if (!this.availableSessions.some(s => s.id === this.sessionId)) {
      this.availableSessions.push(this.makeSessionSummary(this.sessionId));
    }
  },
  watch: {
    sessionId(newVal) {
      if (newVal) {
        this.fetchSessionHistory(newVal);
      }
    }
  },
  methods: {
    makeSessionSummary(id: string, createTime?: number): SessionSummary {
      const time = createTime || Date.now() / 1000;
      const label = createTime
        ? `${new Date(createTime * 1000).toISOString().slice(0, 19).replace('T', ' ')} — ${id}`
        : id;
      return { id, createTime: time, label, isNew: !createTime };
    },
    async fetchSessions() {
      try {
        const response = await axios.get(`/api/v2/agents/sessions`);
        const data = response.data;
        const items = Array.isArray(data) ? data : (Array.isArray(data.sessions) ? data.sessions : []);
        this.availableSessions = items
          .map((s: string | ADKSession) =>
            typeof s === 'string' ? this.makeSessionSummary(s) : this.makeSessionSummary(s.id, s.createTime)
          )
          .sort((a: SessionSummary, b: SessionSummary) => a.createTime - b.createTime);
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    },
    async fetchSessionHistory(sessionId: string) {
      this.loading = true;
      try {
        const response = await axios.get(`/api/v2/agents/sessions/${sessionId}`);
        const session: ADKSession = response.data;
        this.reconstructMessages(session.events);
      } catch (err) {
        console.error(`Failed to fetch history for session ${sessionId}`, err);
        // Clear messages if session not found or error
        this.messages = [];
      } finally {
        this.loading = false;
      }
    },
    reconstructMessages(events: AgentEvent[]) {
      this.messages = [];
      if (!events || events.length === 0) return;

      let currentAgentMsg: ChatMessage | null = null;

      for (const event of events) {
        // If the event indicates it's from the user
        if (event.author === 'user' || event.role === 'user') {
          const text = event.content?.parts?.map(p => p.text).filter(t => !!t).join('') || '';
          if (text) {
            this.messages.push({ sender: 'user', parts: [{ type: 'text', text }] });
          }
          currentAgentMsg = null;
        } else {
          // If it's an agent event
          if (!currentAgentMsg) {
            currentAgentMsg = { sender: "agent", parts: [], author: event.author };
            this.messages.push(currentAgentMsg);
          }
          this.handleAgentEvent(event, currentAgentMsg);
        }
      }
      this.scrollToBottom();
    },
    createNewSession() {
      this.sessionId = "session-" + Math.random().toString(36).substring(7);
      if (!this.availableSessions.some(s => s.id === this.sessionId)) {
        this.availableSessions.push(this.makeSessionSummary(this.sessionId));
      }
      this.messages = [];
    },
    toggleAllCollapsed() {
      this.allCollapsed = !this.allCollapsed;
      this.thoughtsCollapsed = this.allCollapsed;
      this.toolsCollapsed = this.allCollapsed;
      for (const msg of this.messages) {
        if (msg.sender === "agent") {
          for (const part of msg.parts) {
            if (part.type !== 'text' && part.type !== 'transfer') {
              part.collapsed = this.allCollapsed;
            }
          }
        }
      }
    },
    toggleThoughts() {
      this.thoughtsCollapsed = !this.thoughtsCollapsed;
      for (const msg of this.messages) {
        if (msg.sender === "agent") {
          for (const part of msg.parts) {
            if (part.type === 'thought') {
              part.collapsed = this.thoughtsCollapsed;
            }
          }
        }
      }
    },
    toggleTools() {
      this.toolsCollapsed = !this.toolsCollapsed;
      for (const msg of this.messages) {
        if (msg.sender === "agent") {
          for (const part of msg.parts) {
            if (part.type === 'functionCall' || part.type === 'functionResponse') {
              part.collapsed = this.toolsCollapsed;
            }
          }
        }
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer as HTMLElement;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
          });
        }
      });
    },

    async sendMessage() {
      const text = this.userInput.trim();
      if (!text) return;

      this.messages.push({ sender: "user", parts: [{ type: 'text', text: text }] });
      this.userInput = "";
      this.loading = true;
      this.scrollToBottom();

      this.messages.push({ sender: "agent", parts: [] });
      // We need to reference the object in the array to update it
      const currentAgentMsg = this.messages[this.messages.length - 1];

      await this.sendMessageStream(text, currentAgentMsg);
      this.loading = false;

      // The session now exists on the backend, so it's no longer a draft.
      const entry = this.availableSessions.find(s => s.id === this.sessionId);
      if (entry) {
        entry.isNew = false;
      } else {
        this.fetchSessions();
      }
    },

    async sendMessageStream(userText: string, agentMsgObject: ChatMessage) {
      const payload = {
        session_id: this.sessionId,
        text: userText
      };

      try {
        const response = await fetch(`/api/v2/agents/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.body) {
          throw new Error("Response body is null");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n\n");
          const lastLine = lines.pop();
          buffer = lastLine !== undefined ? lastLine : "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.replace("data: ", "");
              try {
                const event: AgentEvent = JSON.parse(jsonStr);
                this.handleAgentEvent(event, agentMsgObject);
              } catch (e) {
                console.error("Error parsing SSE JSON", e);
              }
            }
          }
        }
      } catch (err) {
        console.error("Stream connection failed", err);
        agentMsgObject.parts.push({ type: 'text', text: "\n[Error connecting to agent]" });
      }
    },

    handleAgentEvent(event: AgentEvent, agentMsgObject: ChatMessage) {
      if (event.author && !agentMsgObject.author) {
        agentMsgObject.author = event.author;
      }

      if (event.error) {
        agentMsgObject.parts.push({
          type: 'error',
          text: event.error,
          errorType: event.error_type
        });
        this.scrollToBottom();
        return;
      }

      if (event.content && event.content.parts) {
        for (const part of event.content.parts) {
          if (part.text !== undefined) {
            const isThought = !!part.thought;
            const lastPart = agentMsgObject.parts[agentMsgObject.parts.length - 1];

            // If the chunk types match, append it to the active part string
            if (lastPart && (
                (lastPart.type === 'thought' && isThought) ||
                (lastPart.type === 'text' && !isThought)
               )) {
                 if (lastPart.type === 'thought' || lastPart.type === 'text') {
                   lastPart.text += part.text.trim();
                 }
            } else {
              if (isThought) {
                agentMsgObject.parts.push({
                   type: 'thought',
                   text: part.text.trim(),
                   collapsed: this.thoughtsCollapsed
                });
              } else {
                agentMsgObject.parts.push({
                   type: 'text',
                   text: part.text.trim()
                });
              }
            }
          } else if (part.function_call) {
            if (part.function_call.name === 'transfer_to_agent') {
              console.log('Transferring to agent', part.function_call.args);
              agentMsgObject.parts.push({
                type: 'transfer',
                destination: event.actions?.transfer_to_agent || (part.function_call.args && part.function_call.args.agent_name) || 'unknown agent',
                collapsed: false
              });
            } else {
              agentMsgObject.parts.push({
                type: 'functionCall',
                ...part.function_call,
                collapsed: this.toolsCollapsed
              });
            }
          } else if (part.function_response) {
            if (part.function_response.name === 'transfer_to_agent') {
              const lastPart = agentMsgObject.parts[agentMsgObject.parts.length - 1];
              // Avoid duplicate visual transfer chunks for functionResponse
              if (lastPart && lastPart.type === 'transfer') {
                continue;
              }
              agentMsgObject.parts.push({
                type: 'transfer',
                destination: event.actions?.transfer_to_agent || 'unknown agent',
                collapsed: false
              });
            } else {
              agentMsgObject.parts.push({
                type: 'functionResponse',
                ...part.function_response,
                collapsed: this.toolsCollapsed
              });
            }
          }
        }
        this.scrollToBottom();
      }
    }
  }
};
</script>

<style scoped>
.session-label {
  font-family: monospace;
}

.chat-container {
  height: 60vh;
  overflow-y: auto;
  padding: 1rem;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.user-message {
  justify-content: flex-end;
}

.agent-message {
  justify-content: flex-start;
}

.agent-message-layout {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 80%;
}

.message-parts-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.agent-card {
  margin-bottom: 8px;
}

.code-block {
  font-family: monospace;
  font-size: 0.85em;
  max-height: 200px;
  overflow-y: auto;
  word-break: break-all;
  white-space: pre-wrap;
}

.pre-wrap {
  white-space: pre-wrap;
}
</style>
