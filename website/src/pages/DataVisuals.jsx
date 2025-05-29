import CalendarData from "../components/CalendarData.jsx";
import ContinentData from "../components/ContinentData.jsx";
import DataGrid from "../components/DataGrid.jsx";

function DataVisuals() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto", 
            textAlign: "center",
            paddingTop: "60px"
        }}>
            <h1>DataVisuals Page</h1>

            {/* Rendering GBIFContinentOccurrences component */}
            {/* <ContinentData /> */}

            <DataGrid>
                <div><CalendarData /></div>
                <div><ContinentData /></div>
                <div><ContinentData /></div>
                <div><ContinentData /></div>
            </DataGrid>
            
        </div>
    );
}

export default DataVisuals;


