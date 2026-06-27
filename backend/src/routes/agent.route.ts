import { Router } from "express";
import { harness } from "../ai/harness/harness";

const router = Router();

router.post("/create", async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).send("Description is required");
  }
  const response = await harness.sendMessage(description);
  res.status(200).json({
    success: true,
    message: response
  });
});

export default router;
