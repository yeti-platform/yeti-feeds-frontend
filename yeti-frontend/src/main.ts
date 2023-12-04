/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from "@/plugins";

// Components
import App from "./App.vue";

// Composables
import { createApp } from "vue";

// Eventbus
import eventBus from "./plugins/eventbus";
import { addHook } from "isomorphic-dompurify";

const app = createApp(App);

registerPlugins(app);

app.use(eventBus);
app.mount("#app");
