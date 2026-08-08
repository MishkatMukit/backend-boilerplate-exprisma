import type { NextFunction, Request, Response } from "express";
import { ActiveStatus, type Role } from "../../generated/prisma/enums";
import catchAsync from "../utils/catchAsync";
import config from "../config";
import { jwtUtils } from "../utils/jwt";
import type { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization?.split(" ")[1]
        : req.headers.authorization);

    if (!token) {
      throw new Error("You are not logged in. Please login to access resources.");
    }

    const verifiedToken = jwtUtils.verifyToken(token as string, config.jwt_access_secret);

    if (!verifiedToken.success) {
      throw new Error(verifiedToken.error);
    }

    const { id, role } = verifiedToken.data as JwtPayload;

    if (requiredRoles.length && !requiredRoles.includes(role as Role)) {
      throw new Error("Forbidden. You don't have permission to access this resource");
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("User not found. Please login again.");
    }

    if (user.status === ActiveStatus.SUSPENDED) {
      throw new Error("Your account has been suspended. Please contact support.");
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  });
};

export default auth;
