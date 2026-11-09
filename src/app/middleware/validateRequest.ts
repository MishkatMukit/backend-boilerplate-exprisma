import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

// On failure, forwards the ZodError to the global error handler, which responds 400
const validateRequest = (schema: ZodType<any>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return next(result.error);
    }
    req.body = result.data;
    next();
  };
};

export default validateRequest;
