<template>
  <v-container fluid class="mx-10 mt-3">
    <v-row>
      <v-col>
        <h2 class="mb-4">Agent Chat (session ID {{ sessionId }})</h2>
        <div class="chat-container mb-4" ref="chatContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message-wrapper', msg.sender === 'user' ? 'user-message' : 'agent-message']"
          >
            <div v-if="msg.sender === 'user'" class="pa-3 mb-2 d-inline-block rounded-card bg-primary text-white">
              <div style="white-space: pre-wrap">{{ msg.parts[0]?.text }}</div>
            </div>
            <div v-else class="agent-message-layout">
              <div v-if="msg.parts.length > 0" class="message-parts-container">
                <template v-for="(part, idx) in msg.parts" :key="idx">
                  <div v-if="part.thought" v-show="showThoughts" class="pa-3 mb-2 rounded-card part thought">
                    <div class="d-flex align-center mb-1 text-caption cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <v-icon size="small" class="mr-1">mdi-brain</v-icon>
                      <span class="font-weight-bold flex-grow-1">Thought</span>
                      <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                    </div>
                    <div v-show="!part.collapsed" style="white-space: pre-wrap" class="mt-2">{{ part.text }}</div>
                  </div>
                  <div v-else-if="part.functionCall" v-show="showToolCalls" class="pa-3 mb-2 rounded-card part tool-call">
                    <div class="d-flex align-center mb-1 text-caption text-secondary cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <v-icon size="small" class="mr-1">mdi-wrench</v-icon>
                      <span class="font-weight-bold flex-grow-1">Tool Call: {{ part.functionCall.name }}</span>
                      <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                    </div>
                    <div v-show="!part.collapsed" class="text-caption text-mono code-block mt-2">{{ JSON.stringify(part.functionCall.args, null, 2) }}</div>
                  </div>
                  <div v-else-if="part.functionResponse" v-show="showToolCalls" class="pa-3 mb-2 rounded-card part tool-response">
                    <div class="d-flex align-center mb-1 text-caption text-secondary cursor-pointer" @click="part.collapsed = !part.collapsed">
                      <v-icon size="small" class="mr-1">mdi-check-circle-outline</v-icon>
                      <span class="font-weight-bold flex-grow-1">Tool Response: {{ part.functionResponse.name }}</span>
                      <v-icon size="small">{{ part.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                    </div>
                    <div v-show="!part.collapsed" class="text-caption text-mono code-block mt-2">{{ typeof part.functionResponse.response === 'string' ? part.functionResponse.response : JSON.stringify(part.functionResponse.response, null, 2) }}</div>
                  </div>
                  <div v-else-if="part.text !== undefined" class="pa-3 mb-2 d-inline-block rounded-card part">
                    <div style="white-space: pre-wrap">{{ part.text }}</div>
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
            variant="text"
            size="small"
            color="primary"
            class="mr-2"
            @click="toggleAllCollapsed"
            :prepend-icon="allCollapsed ? 'mdi-expand-all' : 'mdi-collapse-all'"
          >
            {{ allCollapsed ? 'Expand All' : 'Collapse All' }}
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            color="secondary"
            @click="showThoughts = !showThoughts"
            :prepend-icon="showThoughts ? 'mdi-eye-off' : 'mdi-eye'"
          >
            {{ showThoughts ? 'Hide Thoughts' : 'Show Thoughts' }}
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            color="secondary"
            class="ml-2"
            @click="showToolCalls = !showToolCalls"
            :prepend-icon="showToolCalls ? 'mdi-wrench-clock' : 'mdi-wrench'"
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
interface MessagePart {
  text?: string;
  thought?: boolean;
  collapsed?: boolean;
  functionCall?: {
    id: string;
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    id: string;
    name: string;
    response: any;
  };
}

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
      userId: "user-123",
      sessionId: "session-" + Math.random().toString(36).substring(7)
    };
  },
  methods: {
    toggleAllCollapsed() {
      this.allCollapsed = !this.allCollapsed;
      for (const msg of this.messages) {
        if (msg.sender === "agent") {
          for (const part of msg.parts) {
            if (part.thought || part.functionCall || part.functionResponse) {
              part.collapsed = this.allCollapsed;
            }
          }
        }
      }
    },

    async sendMessage() {
      const text = this.userInput.trim();
      if (!text) return;

      this.messages.push({ sender: "user", parts: [{ text: text, thought: false }] });
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
        agentMsgObject.parts.push({ text: "\n[Error connecting to agent]", thought: false });
      }
    },

    handleAgentEvent(event: AgentEvent, agentMsgObject: ChatMessage) {
      if (event.author && !agentMsgObject.author) {
        agentMsgObject.author = event.author;
      }

      if (event.content && event.content.parts) {
        for (const part of event.content.parts) {
          if (part.text !== undefined) {
            const lastPart = agentMsgObject.parts[agentMsgObject.parts.length - 1];
            if (lastPart && lastPart.text !== undefined && !!lastPart.thought === !!part.thought) {
              lastPart.text += part.text.trim();
            } else {
              agentMsgObject.parts.push({
                text: part.text.trim(),
                thought: !!part.thought,
                collapsed: this.allCollapsed
              });
            }
          } else if (part.function_call) {
            agentMsgObject.parts.push({
              functionCall: part.function_call,
              collapsed: this.allCollapsed
            });
          } else if (part.function_response) {
            agentMsgObject.parts.push({
              functionResponse: part.function_response,
              collapsed: this.allCollapsed
            });
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

.part {
  background-color: #f5f5f5;
}

.thought {
  opacity: 0.8;
  font-style: italic;
  font-size: 0.95em;
}

.text-mono {
  font-family: monospace;
}

.code-block {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.tool-call {
  background-color: #e3f2fd;
}

.tool-response {
  background-color: #e8f5e9;
}
</style>
