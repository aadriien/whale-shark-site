import { Link } from "react-router-dom";
import Globe from '../components/Globe.jsx';

function SharkTracker() {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center"
      }}>
        <h1>SharkTracker Page</h1>
        <p>Here’s where we’ll visualize whale shark data.</p>
        
        {/* Globe component */}
        <Globe />
        
        <Link to="/home" style={{
            marginTop: "20px",
            fontSize: "18px",
            textDecoration: "underline",
            color: "blue"
        }}>
            Go back to Home Page
        </Link>
      </div>
    );
  }
  
  export default SharkTracker;
  

