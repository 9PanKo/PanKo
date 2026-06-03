/** PanKo — Route map: auth, home shell, admin dashboard. */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import SignUp from './pages/signup';
import Home from './pages/home';
import RecipeView from './pages/recipeview';
import CreateRecipe from './pages/createrecipe';
import { ChefsEyeRedirect } from './pages/chefseye';
import RoutePersistence from './components/RoutePersistence';
import DashboardLayout from './components/admin/DashboardLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRecipes from './pages/admin/AdminRecipes';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBlog from './pages/admin/AdminBlog';

function App() {
  return (
    <Router>
      <RoutePersistence />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/home" element={<Home />} />
          <Route path="/recipe/:id" element={<RecipeView />} />
          <Route path="/create" element={<CreateRecipe />} />
          <Route path="/chefseye" element={<ChefsEyeRedirect />} />
          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="recipes" element={<AdminRecipes />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;