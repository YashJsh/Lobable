import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/token";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
});

router.post("/signin", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exists",
      });
    }

    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
