import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      textAlign: "center"
    }}>
      <h1>Welcome to the Whale Shark Project</h1>
      <Link to="/sharktracker" style={{
        marginTop: "20px",
        fontSize: "18px",
        textDecoration: "underline",
        color: "blue"
      }}>
        Go to SharkTracker Page
      </Link>
      <Link to="/animation" style={{
        marginTop: "20px",
        fontSize: "18px",
        textDecoration: "underline",
        color: "blue"
      }}>
        Go to Animation Page
      </Link>
    </div>
  );
}

export default Home;


