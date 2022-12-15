const { AceBaseServer } = require("acebase-server");
const dbname = "mydb";
const server = new AceBaseServer(dbname, {
  host: "localhost",
  port: 5757,
  authentication: {
    enabled: false,
    allowUserSignup: false,
    defaultAccessRule: "auth",
    defaultAdminPassword: "75sdDSFg37w5",
  },
});
server.ready(() => {
  console.log("database server running");
});
