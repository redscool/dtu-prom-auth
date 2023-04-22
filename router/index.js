import express from "express";
import TempToken from "../model/TempToken.js";
import TempLink from "../model/TempLink.js";
import User from "../model/User.js";
import Female from "../model/Female.js";
import Male from "../model/Male.js";
import { randomUUID, createHash } from "crypto";
import { sendVerifyMail, sendResetPasswordMail } from "../util/mailer.js";
import db from "../util/db.js";
import jwt from "jsonwebtoken";

import dotenv from "dotenv";
dotenv.config();

const ACCESS_TOKEN_EXPIRE_TIME = "1d";

const router = express.Router();

router.get("/", (_req, res) => {
  return res.send({
    health: "OK",
  });
});

router.post("/signup", async (req, res) => {
  const { email, password, type } = req.body;

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

function computeSHA256(lines) {
  const hash = createHash("sha256");
  hash.write(lines);
  return hash.digest("base64");
}

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
    id: user._id.toString(),
    type: user.type,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
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
        id: user._id.toString(),
        type: user.type,
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
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
