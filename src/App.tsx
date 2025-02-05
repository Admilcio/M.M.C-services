import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navigation } from './components/Navigation';
import { Services } from './pages/Services';
import { Pastries } from './pages/Pastries';

function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Services />} />
        <Route path="/pastries" element={<Pastries />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;