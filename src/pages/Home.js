import React, { useEffect, useState } from "react";
import axios from "axios";

function HomePage() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Fetch username from the backend (JWT will be sent automatically via cookies)
    axios
      .get("http://localhost:8080/user/username", {
        withCredentials: true,  // Important to send cookies along with the request
      })
      .then((response) => {
        setUsername(response.data.username);  // Get the username from the response
      })
      .catch((error) => {
        console.error("Error fetching username", error);
      });
  }, []);

  return (
    <div className="home-page">
      <h1>Hello, {username ? username : "Guest"}</h1>
    </div>
  );
}

export default HomePage;
