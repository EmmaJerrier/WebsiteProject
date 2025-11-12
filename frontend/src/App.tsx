import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link
} from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import EventDetailPage from "./pages/EventDetailPage";
import FavoritesPage from "./pages/FavoritesPage";

function App() {
  return (
  <BrowserRouter>
    {/* White navbar, black text, full width */}
    <header className="bg-white text-black border-b border-gray-200">
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold">Events Around</div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/search" className="flex items-center gap-1 hover:text-blue-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Search
          </Link>
          <Link to="/favorites" className="flex items-center gap-1 hover:text-red-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"
                stroke="currentColor" strokeWidth="2" />
            </svg>
            Favorites
          </Link>
        </nav>
      </div>
    </header>

    {/* Full-width white content area */}
    <main className="bg-white text-black">
      <Routes>
        <Route path="/" element={<Navigate to="/search" />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
    </main>
  </BrowserRouter>

  );
}

export default App;
