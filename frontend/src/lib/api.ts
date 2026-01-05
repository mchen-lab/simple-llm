import axios from "axios";

// In production, call backend on port 31161
// In development, Vite proxy handles /api -> localhost:31161
const baseURL = import.meta.env.PROD 
  ? `${window.location.protocol}//${window.location.hostname}:31161`
  : "";

const api = axios.create({
  baseURL,
});

export default api;
