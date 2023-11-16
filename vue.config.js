module.exports = {
  devServer: {
    // see https://cli.vuejs.org/config/#devserver for more options
    proxy: {
      "^/api": {
        autoRewrite: true,
        target: "http://api:8000/"
      },
      "^/auth/": {
        autoRewrite: true,
        target: "http://api:8000/"
      }
    }
  }
};
