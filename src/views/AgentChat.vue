<template>
  <v-container fluid class="mx-10 mt-3">
    <v-row>
      <v-col>
        <div class="d-flex align-center mb-4">
          <h2 class="mr-4">Agent chat</h2>
          <v-combobox
            v-model="sessionId"
            :items="availableSessions"
            :item-title="item => item.id"
            label="Session ID"
            density="compact"
            variant="outlined"
            hide-details
            class="flex-grow-1"
          ></v-combobox>
          <v-btn
            color="primary"
            class="ml-2"
            @click="createNewSession"
            prepend-icon="mdi-plus"
          >
            New Session
          </v-btn>
        </div>
        <div class="chat-container mb-4" ref="chatContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-wrapper', msg.sender === 'user' ? 'user-message' : 'agent-message']"
          >
            <div v-if="msg.sender === 'user'" class="pa-3 mb-2 d-inline-block rounded-card bg-primary text-white">
              <div class="pre-wrap">{{ msg.parts[0]?.text }}</div>
            </div>
            <div v-else class="agent-message-layout">
              <div v-if="msg.parts.length > 0" class="message-parts-container">
                <template v-for="(part, idx) in msg.parts" :key="idx">
                  <div v-if="part.type === 'thought'" v-show="showThoughts" class="agent-bubble thought">
                    <div class="d-flex align-center mb-1 text-caption cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <v-icon size="small" class="mr-1">mdi-brain</v-icon>
                      <span class="font-weight-bold flex-grow-1">Thought</span>
                      <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                    </div>
                    <div v-show="!part.collapsed" class="mt-2 pre-wrap">{{ part.text }}</div>
                  </div>
                  <div v-else-if="part.type === 'transfer'" class="agent-bubble transfer-call">
                    <div class="d-flex align-center text-caption font-weight-bold">
                      <v-icon size="small" class="mr-2">mdi-swap-horizontal</v-icon>
                      <span>Agent transfer: {{ msg.author || 'system' }} &rarr; {{ part.destination || 'unknown agent' }}</span>
                    </div>
                  </div>
                  <div v-else-if="part.type === 'functionCall'" v-show="showToolCalls" class="agent-bubble tool-call">
                    <div class="d-flex align-center mb-1 text-caption text-secondary cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <v-icon size="small" class="mr-1">mdi-wrench</v-icon>
                      <span class="font-weight-bold flex-grow-1">Tool Call: {{ part.name }}</span>
                      <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                    </div>
                    <div v-show="!part.collapsed" class="text-caption code-block mt-2">{{ JSON.stringify(part.args, null, 2) }}</div>
                  </div>
                  <div v-else-if="part.type === 'functionResponse'" v-show="showToolCalls" class="agent-bubble tool-response">
                    <div class="d-flex align-center mb-1 text-caption text-secondary cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <v-icon size="small" class="mr-1">mdi-check-circle-outline</v-icon>
                      <span class="font-weight-bold flex-grow-1">Tool Response: {{ part.name }}</span>
                      <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                    </div>
                    <div v-show="!part.collapsed" class="text-caption code-block mt-2">{{ typeof part.response === 'string' ? part.response : JSON.stringify(part.response, null, 2) }}</div>
                  </div>
                  <div v-else-if="part.type === 'text'" class="agent-bubble d-inline-block">
                    <div class="pre-wrap">{{ part.text }}</div>
                  </div>
                </template>
              </div>
              <div v-if="loading && index === messages.length - 1" class="pa-3 mb-2 d-inline-block rounded-card bg-surface">
                <v-progress-circular indeterminate size="20" width="2"></v-progress-circular>
              </div>
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
              @click="showThoughts = !showThoughts"
              :prepend-icon="showThoughts ? 'mdi-eye-off' : 'mdi-eye'"
              class="mr-2"
              color="primary" variant="outlined" size="small"
            >
              {{ showThoughts ? 'Hide Thoughts' : 'Show Thoughts' }}
            </v-btn>
            <v-btn
              @click="showToolCalls = !showToolCalls"
              :prepend-icon="showToolCalls ? 'mdi-wrench-clock' : 'mdi-wrench'"
              class="mr-2"
              color="primary" variant="outlined" size="small"
            >
              {{ showToolCalls ? 'Hide Tools' : 'Show Tools' }}
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
type MessagePartType = 'text' | 'thought' | 'functionCall' | 'functionResponse' | 'transfer';

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

type MessagePart = TextPart | ThoughtPart | FunctionCallPart | FunctionResponsePart | TransferPart;

interface ChatMessage {
  sender: "user" | "agent";
  parts: MessagePart[];
  author?: string;
}

interface AgentEvent {
  author?: string;
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

export default {
  name: "AgentChat",
  data() {
    return {
      userInput: "" as string,
      messages: [] as ChatMessage[],
      loading: false as boolean,
      showThoughts: true as boolean,
      showToolCalls: true as boolean,
      allCollapsed: false as boolean,
      userId: "yeti",
      sessionId: "session-" + Math.random().toString(36).substring(7),
      availableSessions: [] as string[]
    };
  },
  async mounted() {
    await this.fetchSessions();
    if (!this.availableSessions.includes(this.sessionId)) {
      this.availableSessions.push(this.sessionId);
    }
  },
  methods: {
    async fetchSessions() {
      try {
        const response = await fetch(`http://localhost:3000/api/v2/agents/sessions/${this.userId}`);
        if (response.ok) {
          const data = await response.json();
          // Assume data is an array of strings or has a specific structure. Assuming string array.
          if (Array.isArray(data)) {
            this.availableSessions = data;
          } else if (data.sessions && Array.isArray(data.sessions)) {
            this.availableSessions = data.sessions;
          }
        }
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      }
    },
    createNewSession() {
      this.sessionId = "session-" + Math.random().toString(36).substring(7);
      if (!this.availableSessions.includes(this.sessionId)) {
        this.availableSessions.push(this.sessionId);
      }
      this.messages = [];
    },
    toggleAllCollapsed() {
      this.allCollapsed = !this.allCollapsed;
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

    async sendMessage() {
      const text = this.userInput.trim();
      if (!text) return;

      this.messages.push({ sender: "user", parts: [{ type: 'text', text: text }] });
      this.userInput = "";
      this.loading = true;

      this.messages.push({ sender: "agent", parts: [] });
      // We need to reference the object in the array to update it
      const currentAgentMsg = this.messages[this.messages.length - 1];

      await this.sendMessageStream(text, currentAgentMsg);
      this.loading = false;
    },

    async sendMessageStream(userText: string, agentMsgObject: ChatMessage) {
      const payload = {
        user_id: this.userId,
        session_id: this.sessionId,
        text: userText
      };

      try {
        const response = await fetch("http://localhost:3000/api/v2/agents/stream", {
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
                   collapsed: this.allCollapsed
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
              agentMsgObject.parts.push({
                type: 'transfer',
                destination: event.actions?.transfer_to_agent || (part.function_call.args && part.function_call.args.agent) || 'unknown agent',
                collapsed: false
              });
            } else {
              agentMsgObject.parts.push({
                type: 'functionCall',
                ...part.function_call,
                collapsed: this.allCollapsed
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
                collapsed: this.allCollapsed
              });
            }
          }
        }
      }
    }
  }
};
</script>

<style scoped>
.chat-container {
  height: 60vh;
  overflow-y: auto;
  border: 1px solid #aaa;
  padding: 1rem;
  border-radius: 4px;
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

.rounded-card {
  border-radius: 8px;
}

.agent-bubble {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.thought {
  background-color: #fff3bc;
  color: #bf6744;
  border: 1px dashed #d68261;
  opacity: 0.8;
  font-style: italic;
  font-size: 0.95em;
}

.code-block {
  font-family: monospace;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  word-break: break-all;
  white-space: pre-wrap;
}

.pre-wrap {
  white-space: pre-wrap;
}

.tool-call {
  background-color: #e3f2fd;
  border: 1px dashed #90caf9;
}

.tool-response {
  background-color: #e8f5e9;
  border: 1px dashed #a5d6a7;
}

.transfer-call {
  background-color: #f3e5f5;
  border: 1px dashed #ce93d8;
  color: #6a1b9a;
}

</style>
