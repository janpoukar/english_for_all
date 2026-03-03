import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const userData = JSON.parse(user);

    if (userData.role === "tutor") {
      navigate("/tutor-dashboard", { replace: true });
      return;
    }

    if (userData.role === "student") {
      navigate("/student-dashboard", { replace: true });
      return;
    }

    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
}
