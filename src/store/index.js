import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

Vue.use(Vuex);

const state = {
  user: null,
  appConfig: null
};

const actions = {
  login({ commit }, params) {
    return new Promise((resolve, reject) => {
      commit("authRequest");
      axios
        .post("/api/auth/login", params)
        .then(response => {
          if (response.data.authenticated === true) {
            axios.get("/api/users").then(response => commit("authSuccess", response.data));
            resolve(response);
          }
        })
        .catch(err => {
          commit("authError", err);
          reject(err);
        });
    });
  },
  logout({ commit }) {
    return new Promise(resolve => {
      axios.post(`/api/auth/logout`).then(response => {
        commit("logout");
        resolve(response);
      });
    });
  },
  refresh({ commit }) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/api/users/`)
        .then(response => {
          console.log("Session refresh success");
          commit("authSuccess", response.data);
          resolve(response);
        })
        .catch(error => {
          console.log("Session refresh fail");
          reject(error);
        });
    });
  },
  getAppConfig({ commit }) {
    axios.get("/api/system/config/").then(response => {
      commit("setAppConfig", response.data);
    });
  }
};

const mutations = {
  authRequest(state) {
    state.user = null;
  },
  authSuccess(state, data) {
    state.user = data;
  },
  authError(state, error) {
    console.log(error);
    state.user = null;
  },
  logout(state) {
    state.user = null;
  },
  setAppConfig(state, data) {
    state.appConfig = data;
  }
};

const getters = {
  isAuthenticated: state => !!state.user,
  isAdmin: state => {
    if (state.user) {
      return !!state.user.permissions.admin;
    } else {
      return false;
    }
  },
  tokenSubject: state => state.user.username,
  appConfig: state => state.appConfig
};

const store = new Vuex.Store({
  state,
  actions,
  mutations,
  getters
});

export default store;
