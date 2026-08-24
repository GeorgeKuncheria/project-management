import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';

export interface Project {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}


export interface User {
  userId?: number;
  username: string;
  email: string;
  profilePictureUrl?: string;
  cognitoId?: string;
  teamId?: number;
}


export interface Attachment {
  id: number;
  fileURL: string;
  fileName: string;
  taskId: number;
  uploadedById: number;
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "Work In Progress",
  UnderReview = "Under Review",
  Completed = "Completed"
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Backlog = "Backlog",
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  points?: number;
  projectId: number;
  authorUserId?: number;
  assignedUserId?: number;

  author?: User;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
}


export interface SearchResults{
    tasks?: Task[];
    projects?: Project[];
    users?: User[];
}


export interface Team{
    teamId: number;
    teamName: string;
    productOwnderUserId?: number;
    projectManagerUserId?: number;
} 





export const api = createApi({
    baseQuery: fetchBaseQuery({baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL}),
    reducerPath: 'api',
    tagTypes:["Projects","Tasks","Search","Users","Teams"],
    endpoints: (build) => ({

        // GET /project — fetch all projects
        getProjects:build.query<Project[],void>({
            query: () => "project",
            providesTags:["Projects"],
        }),

        // POST /project — create a project, then refetch the project list
        createProject:build.mutation<Project,Partial<Project>>({
            query:(project) => ({
                url:"project",
                method:"POST",
                body:project,
            }),
            invalidatesTags:["Projects"]
        }),

        // GET /tasks?projectId= — fetch tasks for one project
        getTasks:build.query<Task[], { projectId: number }>({
            query: ({ projectId }) => `tasks?projectId=${projectId}`,
            // tags each task individually so a single task update only refetches that task, not the whole list
            providesTags: (result) =>
                result ? result.map(({ id }) => ({ type: 'Tasks' as const, id })) : [{type:"Tasks" as const}],
        }),

        getTasksByUser:build.query<Task[], { userId: number }>({
            query: ({ userId }) => `tasks/user/${userId}`,
            providesTags:(result, error, arg) =>
                result
                    ? result.map(({ id }) => ({ type: 'Tasks' as const, id }))
                    : [{ type: 'Tasks' as const, id: arg.userId }],

        }),


        // POST /tasks — create a task, then refetch task lists
        createTask:build.mutation<Task,Partial<Task>>({
            query:(task) => ({
                url:"tasks",
                method:"POST",
                body:task,
            }),
            invalidatesTags:["Tasks"]
        }),

        // PATCH /tasks/:taskId/status — update just a task's status (e.g. drag-and-drop between columns)
        updateTaskStatus:build.mutation<Task,{taskId:number;status:string;}>({
            query:({taskId,status}) => ({
                url:`tasks/${taskId}/status`,
                method:"PATCH",
                body:{status},
            }),
            // only invalidate the one task that changed, not the whole Tasks list
            invalidatesTags:(result,error,{taskId})=>[
                {type:"Tasks",id:taskId},
            ],
        }),

        //GET /search - search tasks,project,users
        search:build.query<SearchResults,string>({
            query:(query)=> `search?query=${query}`,
            providesTags:["Search"],
        }),

        getUsers:build.query<User[],void>({
            query: ()=> "users",
            providesTags:["Users"]
        }),

        getTeams:build.query<Team[],void>({
            query: ()=> "teams",
            providesTags:["Teams"]
        })
    }),
});


export const {
        useGetProjectsQuery,
        useCreateProjectMutation,
        useGetTasksQuery,
        useGetTasksByUserQuery,
        useCreateTaskMutation,
        useUpdateTaskStatusMutation,
        useSearchQuery,
        useGetUsersQuery,
        useGetTeamsQuery
    } = api;