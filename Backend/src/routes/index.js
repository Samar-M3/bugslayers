const express = require("express");
const router = express.Router();
const userRouter = require("./user.router");
const parkingRouter = require("./parking.router");
const adminRouter = require("./admin.router");

const routers = [
  {
    path: "/users",
    route: userRouter,
  },
  {
    path: "/parking",
    route: parkingRouter,
  },
  {
    path: "/admin",
    route: adminRouter,
  },
  {
    path: "/test",
    route: (req, res) => {
      res.send("test route");
    },
  },
];
routers.map((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
