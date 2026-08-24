"use client";

import { useGetTeamsQuery } from '@/state/api'
import { useAppSelector } from '../redux';
import Header from '@/components/Header';
import { DataGrid, GridColDef} from '@mui/x-data-grid';

import { dataGridClassNames, dataGridSxStyles } from '@/libs/utils';


const columns:GridColDef[] = [
    {field:'id',headerName:"ID",flex:0.4,minWidth:60},
    {field:'teamName', headerName:"Team Name",flex:1,minWidth:120},
    {field:'productOwnerUsername', headerName:"Product Owner Name",flex:1,minWidth:170,
        valueGetter:(value,row)=> row.productOwner?.username || "Unassigned"},
    {field:'projectManagerUsername', headerName:"Project Manager Name",flex:1,minWidth:170,
        valueGetter:(value,row)=> row.projectManager?.username || "Unassigned"},
]




const Teams = () => {
    const {data:teams,isLoading,isError}=useGetTeamsQuery();
    const isDarkMode=useAppSelector((state)=>state.global.isDarkMode);

    if (isLoading) return <div>Loading...</div>
    if (isError || !teams) return <div>Error Fetching Teams</div>


    return (
        <div className='flex w-full flex-col p-4 md:p-8'>
            <Header name="Teams"/>
            <div className='h-[70vh] w-full md:h-162.5'>
                <DataGrid
                    rows={teams||[]}
                    columns={columns}
                    pagination
                    className={dataGridClassNames}
                    showToolbar
                    sx={dataGridSxStyles(isDarkMode)}
                />
            </div>
        </div>
    )
}

export default Teams