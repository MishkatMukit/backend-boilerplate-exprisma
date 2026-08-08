import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

const validateRequest = (schema: ZodType<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Validation failed",
        errorDetails: result.error.issues,
      });
    }
    req.body = result.data;
    next();
  };
};

export default validateRequest;
