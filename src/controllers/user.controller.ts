import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../utils/common";
import { logger, prisma } from "../config";
import { StatusCodes } from "http-status-codes";
import { UserRoles } from "../generated/prisma";
import { sendEmail } from "../services";

export const changeRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      ErrorResponse.error = "User ID is required";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const isUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!isUser) {
      ErrorResponse.error = "User not found";
      res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
      return;
    }

    const updatedUser = await prisma.roleChangeRequest.create({
      data: {
        userId: isUser.id,
        newRole: UserRoles.DRIVER,
      },
    });

    const emailPayload = {
      toMail: isUser.email,
      subject: "Role Change Request",
      body: `
      <h1>We Recieved Your Role Change Request</h1>
      <p> We Will verify and let you know </p>
      `,
    };
    await sendEmail(emailPayload);

    SuccessResponse.data = updatedUser;
    SuccessResponse.message = "Role changed successfully";
    res.status(StatusCodes.OK).json(SuccessResponse);
    return;
  } catch (error: any) {
    ErrorResponse.error = error;
    logger.error("Error in changeRole:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
};


export const uploadDocs=async(req:Request,res:Response)=>{
  try {
    

  } catch (error:any) {
    ErrorResponse.error = error;
    logger.error("Error in uploadDocs:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
    return;
  }
}