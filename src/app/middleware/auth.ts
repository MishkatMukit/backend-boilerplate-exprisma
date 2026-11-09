import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ActiveStatus, type Role } from "../../generated/prisma/enums";
import catchAsync from "../utils/catchAsync";
import config from "../config";
import { jwtUtils } from "../utils/jwt";
import type { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/appError";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        name: string;
        id: string;
        role: Role;
      };
    }
  }
}

const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization?.split(" ")[1]
        : req.headers.authorization);

    if (!token) {
      throw new AppError("You are not logged in. Please login to access resources.", httpStatus.UNAUTHORIZED);
    }

    const verifiedToken = jwtUtils.verifyToken(token as string, config.jwt_access_secret);

    if (!verifiedToken.success) {
      throw new AppError(verifiedToken.error, httpStatus.UNAUTHORIZED);
    }

    const { id, role } = verifiedToken.data as JwtPayload;

    if (requiredRoles.length && !requiredRoles.includes(role as Role)) {
      throw new AppError("Forbidden. You don't have permission to access this resource", httpStatus.FORBIDDEN);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError("User not found. Please login again.", httpStatus.UNAUTHORIZED);
    }

    if (user.status === ActiveStatus.SUSPENDED) {
      throw new AppError("Your account has been suspended. Please contact support.", httpStatus.FORBIDDEN);
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
