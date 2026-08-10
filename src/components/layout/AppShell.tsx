import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-ithaca">
      <Sidebar />
      <main className="ml-64 min-h-screen" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}