import { Link } from "react-router-dom";

function Animation() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      textAlign: "center"
    }}>
      <h1>Animation Page</h1>
      <Link to="/home" style={{
        marginTop: "20px",
        fontSize: "18px",
        textDecoration: "underline",
        color: "blue"
      }}>
        Go back to Home Page
      </Link>
      <Link to="/sharktracker" style={{
        marginTop: "20px",
        fontSize: "18px",
        textDecoration: "underline",
        color: "blue"
      }}>
        Go to SharkTracker Page
      </Link>
    </div>
  );
}

export default Animation;


