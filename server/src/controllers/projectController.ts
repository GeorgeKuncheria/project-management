import {Request, Response} from 'express';
import { PrismaClient } from '../../generated/prisma';
import { indexProject, safeIndex } from '../search/indexer';

const prisma = new PrismaClient();

export const getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const projects = await prisma.project.findMany();
        res.status(200).json(projects);
    } catch (error:any) {
        res.status(500).json({ message: `Error retrieving projects: ${error.message}` });
    }
};


export const createProject = async (req: Request, res: Response): Promise<void> => {
    const {name,description,startDate,endDate} = req.body;

    try {
        const newProject= await prisma.project.create({
            data:{
                name,
                description,
                startDate,
                endDate
            }
        })
        safeIndex(() => indexProject(newProject.id));
 
        res.status(200).json(newProject);
    
    } catch (error:any) {
        res.status(500).json({ message: `Error creating project: ${error.message}` });
    }
};
