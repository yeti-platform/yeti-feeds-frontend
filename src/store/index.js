import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

Vue.use(Vuex);

const state = {
  user: null,
  appConfig: null
};

const actions = {
  login({ commit }, form) {
    return new Promise((resolve, reject) => {
      console.log("authRequest");
      commit("authRequest");
      axios
        .post("/api/v2/auth/token", form)
        .then(response => {
          console.log("token yes");
          axios.get("/api/v2/auth/me").then(response => {
            console.log("authSuccess");
            commit("authSuccess", response.data);
          });
          resolve(response);
        })
        .catch(err => {
          commit("authError", err);
          reject(err);
        });
    });
  },
  logout({ commit }) {
    return new Promise(resolve => {
      axios.post(`/api/v2/auth/logout`).then(response => {
        commit("logout");
        resolve(response);
      });
    });
  },
  refresh({ commit }) {
    return new Promise((resolve, reject) => {
      axios
        .get(`/api/v2/auth/me`)
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
    axios.get("/api/v2/system/config").then(response => {
      commit("setAppConfig", response.data);
    });
  }
};

const mutations = {
  authRequest(state) {
    state.user = null;
  },
  authSuccess(state, data) {
    console.log("Logged in as " + data);
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
      return !!state.user.admin;
    } else {
      return false;
    }
  },
  tokenSubject: state => state.user.username,
  userId: state => state.user.id,
  appConfig: state => state.appConfig
};

const store = new Vuex.Store({
  state,
  actions,
  mutations,
  getters
});

export default store;
