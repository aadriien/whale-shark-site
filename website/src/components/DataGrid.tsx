type DataGridProps = {
    children: React.ReactNode;
};


const DataGrid = ({ children }: DataGridProps) => {
    return (
        <div className="data-grid">
            {children}
        </div>
    );
};

export default DataGrid;
    
    