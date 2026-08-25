import { Navigate, Route, Routes } from "react-router-dom";

import { AppHeader } from "./components/AppHeader";
import { ToastProvider } from "./components/ToastProvider";
import { CompanyFormPage } from "./pages/CompanyFormPage";
import { CompanyListPage } from "./pages/CompanyListPage";

export default function App() {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <AppHeader />

        <Routes>
          <Route path="/" element={<CompanyListPage />} />
          <Route path="/companies/new" element={<CompanyFormPage />} />
          <Route path="/companies/:companyId/edit" element={<CompanyFormPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}
