import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import EventDetailPage from "./pages/EventDetailPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 text-white">
        <header className="border-b border-slate-700">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="font-semibold text-lg">Events Around</div>
            <nav className="space-x-4 text-sm">
              <span className="font-medium">Search</span>
              {/* Favorites comes later */}
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/search" />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/event/:id" element={<EventDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
