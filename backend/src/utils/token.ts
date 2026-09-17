import jwt from "jsonwebtoken";
import { requireEnv } from "./env";

const JWT_SECRET = requireEnv("JWT_SECRET");

export interface AuthTokenPayload {
  userId: string;
}

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
};
