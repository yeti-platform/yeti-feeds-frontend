module.exports = {
  devServer: {
    // see https://cli.vuejs.org/config/#devserver for more options
    proxy: {
      "^/api": {
        autoRewrite: true,
        target: "http://fastapi:8000/"
      },
      "^/auth/": {
        autoRewrite: true,
        target: "http://fastapi:8000/"
      }
    }
  }
};
