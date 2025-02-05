/*
  # Add pastry products
  
  1. New Data
    - Add initial pastry products with descriptions and prices
    
  2. Changes
    - Insert pastry products into the pastries table
*/

-- Insert pastry products
INSERT INTO pastries (name, description, price, category, image_url) VALUES
('Pudim', 'Delicioso pudim caseiro com calda de caramelo', 12.99, 'desserts', 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&q=80&w=1000'),
('Rissóis', 'Rissóis tradicionais de camarão ou carne', 1.50, 'pastries', 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&q=80&w=1000'),
('Tábua de Frios', 'Seleção de queijos, presuntos e enchidos portugueses', 25.99, 'platters', 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?auto=format&fit=crop&q=80&w=1000'),
('Brigadeiros', 'Brigadeiros artesanais de chocolate (caixa com 12)', 15.99, 'sweets', 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&q=80&w=1000'),
('Bolo Simples', 'Bolo caseiro de laranja, limão ou chocolate', 18.99, 'cakes', 'https://images.unsplash.com/photo-1464195244916-405fa0a82545?auto=format&fit=crop&q=80&w=1000'),
('Bolo Pintado', 'Bolo decorado para ocasiões especiais', 45.99, 'cakes', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=1000');