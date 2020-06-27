import Vue from "vue";
import VueRouter from "vue-router";
import ObservableSearch from "../views/ObservableSearch.vue";
import ObservableList from "../views/ObservableList.vue";
import ObservableDetails from "../views/ObservableDetails.vue";
import FeedList from "../views/FeedList.vue";
import AnalyticsList from "../views/AnalyticsList.vue";
import ExportList from "../views/ExportList.vue";
import TemplateList from "../views/TemplateList.vue";
import UserProfile from "../views/UserProfile.vue";
import UserAdmin from "../views/UserAdmin.vue";
import GroupAdmin from "../views/GroupAdmin.vue";
import TagsAdmin from "../views/TagsAdmin.vue";
import System from "../views/System.vue";
import Login from "../views/Login.vue";

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
    component: ObservableList,
    props: route => {
      return {
        searchQuery: route.query.q
      };
    }
  },
  {
    path: "/observable/:id([a-z0-9]{24})",
    name: "ObservableDetails",
    component: ObservableDetails,
    props: true
  },
  {
    path: "/feeds",
    name: "Feeds",
    component: FeedList
  },
  {
    path: "/analytics",
    name: "Analytics",
    component: AnalyticsList
  },
  {
    path: "/exports",
    name: "Exports",
    component: ExportList
  },
  {
    path: "/templates",
    name: "Templates",
    component: TemplateList
  },
  {
    path: "/profile/:id([a-z0-9]{24})",
    name: "UserProfileAdmin",
    component: UserProfile,
    props: true
  },
  {
    path: "/profile",
    name: "UserProfile",
    component: UserProfile
  },
  {
    path: "/admin/users",
    name: "UserAdmin",
    component: UserAdmin
  },
  {
    path: "/admin/groups",
    name: "GroupAdmin",
    component: GroupAdmin
  },
  {
    path: "/admin/tags",
    name: "TagsAdmin",
    component: TagsAdmin
  },
  {
    path: "/admin/system",
    name: "SystemView",
    component: System
  },
  {
    path: "/login",
    name: "Login",
    component: Login
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  linkActiveClass: "is-active",
  routes
});

import store from "@/store";
router.beforeEach((to, from, next) => {
  if (to.name == "Login") {
    next();
  } else if (store.state.user === null) {
    store
      .dispatch("refresh")
      .then(() => {
        console.log("redirecting to " + to.fullPath);
        next({ path: to.fullPath });
      })
      .catch(() => {
        console.log("redirecting to /auth/login");
        window.location.href = "/auth/login";
      });
  } else {
    next();
  }
});

export default router;
