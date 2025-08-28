import { Router } from "express";
import { changeRole, getUserById } from "../../controllers";

const router = Router();

// & /api/v1/user/:userId PUT
router.put("/:userId", changeRole);

// * /api/v1/user/:userId GET
router.get("/:userId", getUserById);

export { router as userRoutes };
