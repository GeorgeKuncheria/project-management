"use client";

import { useGetUsersQuery } from '@/state/api'
import React from 'react'
import { useAppSelector } from '../redux';
import Header from '@/components/Header';
import { DataGrid, GridColDef, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import Image from 'next/image';
import { dataGridClassNames, dataGridSxStyles } from '@/libs/utils';


const columns:GridColDef[] = [
    {field:'userId',headerName:"ID",flex:0.4,minWidth:60},
    {field:'username', headerName:"Username",flex:1,minWidth:120},
    {field:'profilePictureUrl', headerName:"Profile Picture",flex:0.6,minWidth:100,
        renderCell:(params)=>(
            <div className='flex h-full w-full items-center justify-center'>
                <div className='h-9 w-9'>
                    <Image
                        src={`/${params.value}`}
                        alt={`${params.row.username}`}
                        width={100}
                        height={50}
                        className='h-full rounded-full object-cover'/>
                </div>
            </div> 
        )
    },
]




const Users = () => {
    const {data:users,isLoading,isError}=useGetUsersQuery();
    const isDarkMode=useAppSelector((state)=>state.global.isDarkMode);

    if (isLoading) return <div>Loading...</div>
    if (isError || !users) return <div>Error Fetching Users</div>


    return (
        <div className='flex w-full flex-col p-4 md:p-8'>
            <Header name="Users"/>
            <div className='h-[70vh] w-full md:h-162.5'>
                <DataGrid
                    rows={users||[]}
                    columns={columns}
                    getRowId={(row)=>row.userId}
                    pagination
                    className={dataGridClassNames}
                    showToolbar
                    sx={dataGridSxStyles(isDarkMode)}
                />
            </div>
        </div>
    )
}

export default Users