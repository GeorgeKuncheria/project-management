export const dataGridClassNames="border border-gray-200 bg-white shadow dark:border-stroke-dark dark:bg-dark-secondary dark:text-gray-200"

export const dataGridSxStyles = (isDarkMode: boolean) => ({
    "& .MuiDataGrid-columnHeaders": {
        color: isDarkMode ? "#e5e7eb" : "",
        '& [role="row"] > *': {
            backgroundColor: isDarkMode ? "#1d1f21" : "white",
            borderColor: isDarkMode ? "#2d3135" : "",
        },
    },
    "& .MuiIconButton-root": {
        color: isDarkMode ? "#a3a3a3" : "",
    },
    "& .MuiTablePagination-root": {
        color: isDarkMode ? "#a3a3a3" : "",
    },
    "& .MuiTablePagination-selectIcon": {
        color: isDarkMode ? "#a3a3a3" : "",
    },
    "& .MuiDataGrid-cell": {
        border: "none",
        color: isDarkMode ? "#e5e7eb" : "",
    },
    "& .MuiDataGrid-row": {
        backgroundColor: isDarkMode ? "#1d1f21" : "white",
        borderBottom: `1px solid ${isDarkMode ? "#2d3135" : "#e5e7eb"}`,
        "&:hover": {
            backgroundColor: isDarkMode ? "#26292c" : "#f9fafb",
        },
        "&.Mui-selected": {
            backgroundColor: isDarkMode ? "#2a2e33" : "#f3f4f6",
            "&:hover": {
                backgroundColor: isDarkMode ? "#2f333a" : "#e5e7eb",
            },
        },
    },
    "& .MuiDataGrid-withBorderColor": {
        borderColor: isDarkMode ? "#2d3135" : "#e5e7eb",
    },
    "& .MuiDataGrid-virtualScroller": {
        backgroundColor: isDarkMode ? "#1d1f21" : "white",
    },
    "& .MuiDataGrid-footerContainer": {
        backgroundColor: isDarkMode ? "#1d1f21" : "white",
        color: isDarkMode ? "#e5e7eb" : "",
    },
    "& .MuiDataGrid-toolbarContainer": {
        backgroundColor: isDarkMode ? "#1d1f21" : "white",
        color: isDarkMode ? "#e5e7eb" : "",
        "& .MuiInputBase-root": {
            color: isDarkMode ? "#e5e7eb" : "",
        },
        "& .MuiSvgIcon-root": {
            color: isDarkMode ? "#a3a3a3" : "",
        },
    },
});