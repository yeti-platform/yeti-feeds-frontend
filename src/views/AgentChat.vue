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
            <v-card :color="msg.sender === 'user' ? 'primary' : 'surface'" :class="['pa-3', 'mb-2', 'd-inline-block']">
              <div v-if="msg.sender === 'agent' && msg.text === ''">
                <v-progress-circular indeterminate size="20" width="2"></v-progress-circular>
              </div>
              <div v-else style="white-space: pre-wrap">{{ msg.text }}</div>
            </v-card>
          </div>
        </div>

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
interface ChatMessage {
  sender: "user" | "agent";
  text: string;
}

interface AgentEvent {
  content?: {
    parts?: Array<{
      text?: string;
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
      userId: "user-123",
      sessionId: "session-" + Math.random().toString(36).substring(7)
    };
  },
  methods: {
    async sendMessage() {
      const text = this.userInput.trim();
      if (!text) return;

      this.messages.push({ sender: "user", text: text });
      this.userInput = "";
      this.loading = true;

      const agentMsg: ChatMessage = { sender: "agent", text: "" };
      this.messages.push({ sender: "agent", text: "" });
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
        agentMsgObject.text += "\n[Error connecting to agent]";
      }
    },

    handleAgentEvent(event: AgentEvent, agentMsgObject: ChatMessage) {
      if (event.content && event.content.parts) {
        const textPart = event.content.parts.find(p => p.text);
        if (textPart && textPart.text) {
          agentMsgObject.text += textPart.text;
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


</style>
