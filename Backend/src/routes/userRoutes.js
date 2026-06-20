import express from "express";
import {
  createUserProfile,
  getUserProfile,
  listUsers,
  getMyProfile,
} from "../controllers/userController.js";

const router = express.Router();
router.post("/", createUserProfile);
router.get("/", listUsers);
router.get("/me", getMyProfile);
router.get("/:id", getUserProfile);

export default router;
