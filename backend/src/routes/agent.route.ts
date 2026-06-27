import { Router } from "express";

const router = Router();

router.post("/create", (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).send("Description is required");
  }
  
  res.send("Agent initialized");
});

export default router;
