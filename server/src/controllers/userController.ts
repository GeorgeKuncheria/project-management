import {Request, Response} from 'express';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response): Promise<void> => {

    const {projectId} = req.query;
    try {
        const users = await prisma.user.findMany()
        res.status(200).json(users);
    } catch (error:any) {
        res.status(500).json({ message: `Error retrieving users: ${error.message}` });
    }
};

