import { useAppSelector } from '@/app/redux';
import Header from '@/components/Header';
import { dataGridClassNames, dataGridSxStyles } from '@/libs/utils';
import { useGetTasksQuery } from '@/state/api';
import {DataGrid,GridColDef} from "@mui/x-data-grid";
import React from 'react'

type TableProps={
    id:string;
    setIsModalNewTaskOpen:(isOpen:boolean)=>void;

}

const columns: GridColDef[] =[
    {
        field:"title",
        headerName:"Title",
        width:100
    },

    {
        field:"description",
        headerName:"Description",
        width:200
    },

    {
        field:"status",
        headerName:"Status",
        renderCell: (params)=>(
            <span className='inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800'>
                {params.value}
            </span>
        ),
        width:130
    },

    {
        field:"priority",
        headerName:"Priority",
        width:75
    },

    {
        field:"tags",
        headerName:"Tags",
        width:130
    },

    {
        field:"startDate",
        headerName:"Start Date",
        width:130
    },

    {
        field:"dueDate",
        headerName:"Due Date",
        width:130
    },

    {
        field:"author",
        headerName:"Author",
        renderCell: (params)=> params.value?.username || "Unknown",
        width:150
    },

    {
        field:"assignee",
        headerName:"Assignee",
        renderCell: (params)=> params.value?.username || "Unknown",
        width:150
    }
]


const TableView = ({id,setIsModalNewTaskOpen}: TableProps) => {

    const isDarkMode = useAppSelector((state)=>state.global.isDarkMode);
    const {data:tasks,isLoading,error} = useGetTasksQuery({projectId:Number(id)}) 
        if (isLoading){
            return (
                <div>Loading...</div>
            )
        }
    
        if (error){
            return(
                <div>An error occurred while fetching Tasks</div>
            )
        }
    return (
        <div className='h-[540px] w-full px-4 pb-8 xl:px-6'>
            <div className='pt-5'>
                <Header name="Table" 
                        buttonComponent={
                            <button className='flex items-center cursor-pointer  rounded bg-blue-primary px-3 py-2 text-white hover:bg-blue-600'
                                onClick={()=>setIsModalNewTaskOpen(true)}>
                                    Add Task
                                </button>   
                    }
                    isSmallText/>
            </div>
            <DataGrid
                rows={tasks || []}
                columns={columns}
                className={dataGridClassNames}
                sx={dataGridSxStyles(isDarkMode)}
                />
        </div>
    )
}

export default TableView