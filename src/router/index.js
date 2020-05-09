import Vue from "vue";
import VueRouter from "vue-router";
import ObservableSearch from "../views/ObservableSearch.vue";
import ObservableList from "../views/ObservableList.vue";
import ObservableDetails from "../views/ObservableDetails.vue";
import FeedList from "../views/FeedList.vue";
import ExportList from "../views/ExportList.vue";
import TemplateList from "../views/TemplateList.vue";
import UserAdmin from "../views/UserAdmin.vue";
import GroupAdmin from "../views/GroupAdmin.vue";

Vue.use(VueRouter);

const routes = [{
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
    path: "/admin/users",
    name: "UserAdmin",
    component: UserAdmin
  },
  {
    path: "/admin/groups",
    name: "GroupAdmin",
    component: GroupAdmin
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
