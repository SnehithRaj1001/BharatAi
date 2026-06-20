import express from "express";
import {
  createRecommendations,
  getRecommendationsByUser,
  generateSmartRecommendations
} from "../controllers/recommendationController.js";

const router = express.Router();
router.post("/", createRecommendations);
router.post("/smart", generateSmartRecommendations);
router.get("/user/:userId", getRecommendationsByUser);

export default router;
