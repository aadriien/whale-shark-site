function Environment() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            overflowY: "auto",
            textAlign: "center",
            // paddingTop: "60px"
        }}>
            <h1>Copernicus Marine Data Viewer</h1>

            <div className="copernicus-visual">
                <iframe src="https://data.marine.copernicus.eu/-/kob6a042j8" width="100%" height="100%"></iframe>
            </div>
        </div>
    );
}

export default Environment;

