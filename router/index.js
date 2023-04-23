import express from "express";
import user from "./user.js"
import TempToken from "../model/TempToken.js";
import TempLink from "../model/TempLink.js";
import User from "../model/User.js";
import Female from "../model/Female.js";
import Male from "../model/Male.js";
import { randomUUID } from "crypto";
import { sendVerifyMail, sendResetPasswordMail } from "../util/mailer.js";
import { computeSHA256, isDTUEmail } from "../util/index.js";
import db from "../util/db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const ACCESS_TOKEN_EXPIRE_TIME = "1d";
const SECRET_KEY = process.env.JWT_SECRET;

const router = express.Router();

router.get("/", (_req, res) => {
  return res.send({
    health: "OK",
  });
});

const verifyUserMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  res.locals.data = token;

  jwt.verify(token, SECRET_KEY, (err, data) => {
    if (err) {
      return res.status(404).send("Unauthorized")
    } else {
      res.locals.data = data;
      next()
    }
  })
}

router.use("/user", verifyUserMiddleware, user);

router.post("/signup", async (req, res) => {
  const { email, password, type } = req.body;

  if (!isDTUEmail(email) && type === 'M') {
    return res.status(400).send({
      success: false,
      message: "Bad Request",
    });
  }

  const userCheck = await User.findOne({ email });

  if (userCheck) {
    return res.status(400).send({
      success: false,
      message: "User already exists",
    });
  }

  const prevToken = await TempToken.findOne({ email }).select({ token: 1 });

  if (prevToken) {
    sendVerifyMail(email, prevToken.token);

    return res.status(201).send({
      success: true,
      message: "Mail already sent, check your email",
      email,
    });
  }

  if (!(type === "M" || type === "F")) {
    return res.status(400).send({
      success: false,
      message: "Invalid user type",
    });
  }

  const processedPassword = computeSHA256(password + process.env.PASSWORD_SALT);

  const token = await TempToken.create({
    email,
    password: processedPassword,
    type,
    token: randomUUID(),
  });

  sendVerifyMail(email, token.token);

  return res.status(201).send({
    success: true,
    message: "Please check your email",
    email,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).send({
      success: false,
      message: "Could not find the user",
    });
  }

  const processedPassword = computeSHA256(password + process.env.PASSWORD_SALT);

  if (processedPassword != user.password) {
    return res.status(401).send({
      success: false,
      message: "Password Invalid",
    });
  }

  const payload = {
    user_id: user._id.toString(),
    type: user.type,
    regComplete: user.regComplete
  };

  const accessToken = jwt.sign(payload, SECRET_KEY, {
    expiresIn: ACCESS_TOKEN_EXPIRE_TIME,
  });

  return res.status(201).send({
    success: true,
    message: "Logged In Successfully",
    accessToken,
  });
});

router.post("/verify", async (req, res) => {
  let session = null,
    user = null;
  db.startSession()
    .then((_session) => {
      session = _session;

      session.startTransaction();
      return TempToken.findOneAndDelete({ token: req.body.token }).session(
        session
      );
    })
    .then((userData) => {
      if (!userData) throw Error("Invalid token");

      user = userData;

      return User.create(
        [
          {
            email: userData.email,
            password: userData.password,
            type: userData.type,
          },
        ],
        { session }
      );
    })
    .then(([userData]) => {
      if (userData.type === "F") {
        return Female.create(
          [
            {
              userId: userData._id,
            },
          ],
          { session }
        );
      } else {
        return Male.create(
          [
            {
              userId: userData._id,
            },
          ],
          { session }
        );
      }
    })
    .then(() => {
      return session.commitTransaction();
    })
    .then(() => {
      const payload = {
        user_id: user._id.toString(),
        type: user.type,
      };

      const accessToken = jwt.sign(payload, SECRET_KEY, {
        expiresIn: ACCESS_TOKEN_EXPIRE_TIME,
      });

      return res.status(201).send({
        success: true,
        accessToken,
      });
    })
    .catch((err) => {
      res.status(400).send({
        success: false,
        message: `Something went error: ${err}`,
      });
      return session.abortTransaction();
    })
    .finally(() => {
      return session.endSession();
    });
});

router.post("/forgotPassword", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email }).select({
      _id: 1,
    });

    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Invalid user email",
      });
    }

    const prevLink = await TempLink.findOne({ email });

    if (prevLink) {
      sendResetPasswordMail(email, prevLink.token);

      return res.status(201).send({
        success: true,
        message: "Mail already sent, check your email to reset password",
      });
    }

    const link = await TempLink.create({
      userId: user._id,
      token: randomUUID(),
    });

    sendResetPasswordMail(email, link.token);

    return res.status(201).send({
      success: true,
      message: "Please check your email to reset password",
    });
  } catch (err) {
    return res.status(400).send({
      success: false,
      message: "Something went wrong",
      error: err,
    });
  }
});

router.post("/resetPassword", async (req, res) => {
  const { token, password } = req.body;
  let session = null;

  db.startSession()
    .then((_session) => {
      session = _session;

      session.startTransaction();
      return TempLink.findOneAndDelete({ token }).session(session);
    })
    .then((userData) => {
      if (!userData) throw Error("Invalid token");

      return User.findById(userData.userId).session(session);
    })
    .then((user) => {
      if (!user) throw Error("Invalid token");

      const processedPassword = computeSHA256(
        password + process.env.PASSWORD_SALT
      );

      return User.findByIdAndUpdate(user._id, {
        password: processedPassword,
      }).session(session);
    })
    .then(() => {
      return session.commitTransaction();
    })
    .then(() => {
      return res.status(201).send({
        success: true,
        message: `Your password is changed, please login again`,
      });
    })
    .catch((err) => {
      res.status(400).send({
        success: false,
        message: `Something went wrong: ${err}`,
      });
      return session.abortTransaction();
    })
    .finally(() => {
      return session.endSession();
    });
});

export default router;
