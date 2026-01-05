
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import LogsPage from "@/pages/LogsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<LogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
