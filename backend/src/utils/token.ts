import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lobable-super-secret-key-12345!";

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
