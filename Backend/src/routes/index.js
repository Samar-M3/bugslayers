const express = require("express");
const router = express.Router();
const userRouter = require("./user.router");
const parkingRouter = require("./parking.router");
const adminRouter = require("./admin.router");
const contactRouter = require("./contact.route");

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

const testRouter = express.Router();
testRouter.get("/", (req, res) => res.send("test route"));

router.use("/users", userRouter);
router.use("/parking", parkingRouter);
router.use("/admin", adminRouter);
router.use("/test", testRouter);
router.use("/contact", contactRouter);

module.exports = router;
