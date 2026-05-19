import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export class HttpError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(_request: Request, response: Response): void {
  response.status(404).json({
    error: "Not found",
  });
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error";

  logger.error("Request failed", error);

  response.status(statusCode).json({
    error: message,
  });
}
