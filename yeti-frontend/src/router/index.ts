// Composables
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "ObservableSearch",
        component: () => import("@/views/ObservableSearch.vue")
      },
      {
        path: "observable/:id([0-9]+)",
        name: "ObservableDetails",
        component: () => import("@/views/ObservableDetails.vue"),
        props: true
      }
    ]
  },
  {
    path: "/feeds",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Feeds",
        component: () => import("@/components/TaskList.vue"),
        props: { taskType: "feed" }
      }
    ]
  },
  {
    path: "/entities",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Entities",
        component: () => import("@/views/EntitySearch.vue")
      },
      {
        path: "entity/:id([0-9]+)",
        name: "EntityDetails",
        component: () => import("@/views/EntityDetails.vue"),
        props: true
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
