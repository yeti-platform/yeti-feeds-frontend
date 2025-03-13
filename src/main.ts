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

import "highlight.js/styles/stackoverflow-light.css";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import yaml from "highlight.js/lib/languages/yaml";
import hljsVuePlugin from "@highlightjs/vue-plugin";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("yaml", yaml);

const app = createApp(App);

registerPlugins(app);

app.use(eventBus);
app.use(hljsVuePlugin);

app.mount("#app");
