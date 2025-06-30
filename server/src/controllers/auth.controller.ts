import {prisma} from "../config";
import bcrypt from "bcryptjs";
import {Request, Response} from "express";
import {StatusCodes} from "http-status-codes";
import {ErrorResponse, SuccessResponse} from "../utils/common";

export const registerUser = async (req: Request, res: Response) => {
    try {
        const {name, email, password, role, phone} = req.body;

        console.log(req.body);

        // Check if email already exists
        const isEmailExists = await prisma.user.findUnique({
            where: {email},
        });

        if (isEmailExists) {
            ErrorResponse.error = "Email already exists";
            res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user using Prisma
        SuccessResponse.data = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                phone,
            },
        });
        res.status(StatusCodes.CREATED).json(SuccessResponse);
    } catch (error: any) {
        console.error("Error registering user:", error);
        ErrorResponse.error = "Internal Server Error";
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
        return;
    }
};
