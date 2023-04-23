import express from "express";
import User from "../model/User.js";
import Female from "../model/Female.js";
import Male from "../model/Male.js";
import { isDTUEmail } from "../util/index.js";
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

router.post("/updateProfile", async (req, res) => {
  try {
    const { user_id, type } = res.locals.data;

    const user = await User.findById(user_id);
    const profile_id = (
      type === "M"
        ? await Male.findOne({ userId: user_id }).select({
            _id: 1,
          })
        : await Female.findOne({ userId: user_id }).select({
            _id: 1,
          })
    )._id;

    if (!user) {
      return res.status(401).send({
        success: false,
        message: "Could not find the user",
      });
    }

    const dtuId = isDTUEmail(user.email);
    const regComplete = user.regComplete;
    const email = user.email;

    const {
      name,
      college,
      branch,
      company,
      age,
      bio,
      instagram,
      linkedin,
      image,
      interest,
      location,
    } = req.body;

    if (!regComplete && !(name && age && interest && (dtuId || college))) {
      return res.status(401).send({
        success: false,
        message: "Bad Request",
      });
    }

    const Model = type === "M" ? Male : Female;

    await Model.updateOne(
      { _id: profile_id },
      {
        ...(name && { name }),
        ...(college && { college }),
        ...(branch && { branch }),
        ...(company && { company }),
        ...(age && { age }),
        ...(instagram && { instagram }),
        ...(linkedin && { linkedin }),
        ...(image && { image }),
        ...(location && { location }),
        ...(bio && { bio }),
        ...(!regComplete && {
          regComplete: true,
          email,
          outsideDTU: !dtuId,
        }),
      }
    );

    if (!regComplete) {
      await User.updateOne(
        { _id: user_id },
        {
          regComplete: true,
        }
      );

      const payload = {
        user_id,
        profile_id,
        type,
        regComplete: true,
      };

      const accessToken = jwt.sign(payload, SECRET_KEY, {
        expiresIn: ACCESS_TOKEN_EXPIRE_TIME,
      });

      return res.status(201).send({
        success: true,
        message: "Updated Successfully",
        accessToken,
      });
    }

    return res.status(201).send({
      success: true,
      message: "Updated Successfully",
    });
  } catch (err) {
    return res.status(401).send({
      success: false,
      message: "Something went wrong",
    });
  }
});

export default router;
