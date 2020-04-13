import Vue from "vue";
import VueRouter from "vue-router";
import ObservableSearch from "../views/ObservableSearch.vue";
import ObservableList from "../views/ObservableList.vue";
import FeedList from "../views/FeedList.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "ObservableSearch",
    component: ObservableSearch
  },
  {
    path: "/browse",
    name: "ObservableList",
    component: ObservableList
  },
  {
    path: "/feeds",
    name: "Feeds",
    component: FeedList
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
