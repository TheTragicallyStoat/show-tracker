//import React from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import ShowPage from './pages/ShowPage';
function App() {
 return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/shows" element={<ShowPage />} />
      </Routes>
    </BrowserRouter>
 );
}
export default App;