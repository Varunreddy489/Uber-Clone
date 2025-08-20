import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, {
  JsonWebTokenError,
  JwtPayload,
  TokenExpiredError,
} from "jsonwebtoken";
import { prisma } from "../config";

interface DecodedToken extends JwtPayload {
  userId: string;
  role: string;
}

/**
 * This middleware function checks if the request is authenticated by verifying the JWT token
 * in the request headers. If the token is valid, it extracts the user ID and role from the token
 * and attaches them to the request object. If the token is invalid or missing, it returns an
 * appropriate error response.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the chain.
 * @returns {Promise<void>} - A promise that resolves when the middleware function is complete.
 */
export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract the token from the request headers
    const token = req.headers.authorization?.split(" ")[1];

    // If there is no token, return an unauthorized response
    if (!token) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Unauthorized - Token not found",
      });
      console.error("Error in middleware:", "Token not found");
      return;
    }

    // Verify the token using the JWT secret
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as DecodedToken;

    // If the token is invalid, return an unauthorized response
    if (!decodedToken) {
      res.status(400).json({
        error: "Unauthorised - Invalid Token",
      });
      return;
    }

    // Find the user with the extracted user ID
    const user = await prisma.user.findUnique({
      where: {
        id: decodedToken.userId,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    // If the user is not found, return a not found response
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Attach the user ID and role to the request object
    req.user = {
      userId: user.id,
      role: decodedToken.role,
    };

    // Call the next middleware function
    next();
  } catch (error) {
    // If the token has expired, return an unauthorized response
    if (error instanceof TokenExpiredError) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Unauthorized - Token has expired",
      });
      console.error("Error in middleware:", error);
      return;
    }
    // If the token is invalid, return an unauthorized response
    else if (error instanceof JsonWebTokenError) {
    } else if (error instanceof JsonWebTokenError) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized - Invalid Token" });
      console.error("Error in middleware:", error);
      return;
    }
    // If an error occurs, return an internal server error response
    else {
      console.error("error in checkIsAuth:", error);
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: "Internal Server Error" });
      return;
    }
  }
};
