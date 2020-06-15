module.exports = {
  devServer: {
    // see https://cli.vuejs.org/config/#devserver for more options
    proxy: {
      "^/api": {
        autoRewrite: true,
        target: "http://localhost:5000/"
      },
      "^/auth/": {
        autoRewrite: true,
        target: "http://localhost:5000/"
      }
    }
  }
};
