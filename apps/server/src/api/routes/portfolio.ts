import { Router } from "express";

import portfolioController from "@/api/controllers/portfolioController";
import { protect } from "@/api/middleware/auth";

const router = Router();

router.use(protect);

router.get("/", portfolioController.getSnapshots);

export default router;