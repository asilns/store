-- Seed data for multi-tenant orders dashboard
-- This should be run after the schema migration

-- Insert sample stores
INSERT INTO stores (id, name, slug, description, status, commission_bps, currency) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Tech Gadgets Store', 'tech-gadgets', 'Premium tech gadgets and accessories', 'active', 500, 'USD'),
('550e8400-e29b-41d4-a716-446655440002', 'Fashion Boutique', 'fashion-boutique', 'Trendy fashion items for all ages', 'active', 600, 'USD'),
('550e8400-e29b-41d4-a716-446655440003', 'Home & Garden', 'home-garden', 'Everything for your home and garden', 'active', 450, 'USD');

-- Insert sample system users (admin)
INSERT INTO system_users (id, email, role) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'admin@example.com', 'super_admin');

-- Insert sample products for Tech Gadgets Store
INSERT INTO products (id, store_id, name, description, sku, category, status, base_price_cents, unit_cost_cents, commission_bps) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Wireless Bluetooth Headphones', 'High-quality wireless headphones with noise cancellation', 'TECH-001', 'Electronics', 'active', 9999, 4500, 500),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'Smartphone Case', 'Durable protective case for smartphones', 'TECH-002', 'Accessories', 'active', 1999, 800, 500),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'USB-C Cable', 'Fast charging USB-C cable', 'TECH-003', 'Cables', 'active', 1499, 500, 500);

-- Insert sample products for Fashion Boutique
INSERT INTO products (id, store_id, name, description, sku, category, status, base_price_cents, unit_cost_cents, commission_bps) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440002', 'Designer T-Shirt', 'Premium cotton designer t-shirt', 'FASH-001', 'Clothing', 'active', 2999, 1200, 600),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440002', 'Leather Handbag', 'Genuine leather handbag', 'FASH-002', 'Accessories', 'active', 8999, 3500, 600),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440002', 'Sunglasses', 'Stylish designer sunglasses', 'FASH-003', 'Accessories', 'active', 5999, 2000, 600);

-- Insert sample products for Home & Garden
INSERT INTO products (id, store_id, name, description, sku, category, status, base_price_cents, unit_cost_cents, commission_bps) VALUES
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440003', 'Garden Tool Set', 'Complete set of essential garden tools', 'HOME-001', 'Garden', 'active', 7999, 3200, 450),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'Kitchen Mixer', 'Professional kitchen stand mixer', 'HOME-002', 'Kitchen', 'active', 12999, 5200, 450),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440003', 'Wall Clock', 'Elegant wall clock for any room', 'HOME-003', 'Decor', 'active', 3999, 1600, 450);

-- Insert sample subscriptions
INSERT INTO subscriptions (id, store_id, plan, status, start_date, end_date, grace_days, price_cents, currency, interval) VALUES
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440001', 'pro', 'active', '2024-01-01', '2024-12-31', 7, 9900, 'USD', 'month'),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440002', 'basic', 'active', '2024-01-01', '2024-12-31', 7, 2900, 'USD', 'month'),
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440003', 'pro', 'active', '2024-01-01', '2024-12-31', 7, 9900, 'USD', 'month');

-- Insert sample orders for Tech Gadgets Store
INSERT INTO orders (id, store_id, order_number, customer_email, customer_name, status, subtotal_cents, tax_cents, shipping_cents, total_cents, commission_cents, profit_cents) VALUES
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440001', '000001', 'john@example.com', 'John Doe', 'delivered', 13497, 1349, 1000, 15846, 674, 6748),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440001', '000002', 'jane@example.com', 'Jane Smith', 'shipped', 1499, 149, 1000, 2648, 74, 599);

-- Insert sample order items for Tech Gadgets Store
INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price_cents, unit_cost_cents, commission_cents, profit_cents, total_cents) VALUES
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440101', 'Wireless Bluetooth Headphones', 'TECH-001', 1, 9999, 4500, 499, 5499, 9999),
('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440102', 'Smartphone Case', 'TECH-002', 1, 1999, 800, 99, 1199, 1999),
('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440103', 'USB-C Cable', 'TECH-003', 1, 1499, 500, 74, 999, 1499),
('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440103', 'USB-C Cable', 'TECH-003', 1, 1499, 500, 74, 999, 1499);

-- Insert sample orders for Fashion Boutique
INSERT INTO orders (id, store_id, order_number, customer_email, customer_name, status, subtotal_cents, tax_cents, shipping_cents, total_cents, commission_cents, profit_cents) VALUES
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440002', '000001', 'sarah@example.com', 'Sarah Johnson', 'delivered', 11998, 1199, 1000, 14197, 719, 5999);

-- Insert sample order items for Fashion Boutique
INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price_cents, unit_cost_cents, commission_cents, profit_cents, total_cents) VALUES
('550e8400-e29b-41d4-a716-446655440801', '550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440201', 'Designer T-Shirt', 'FASH-001', 1, 2999, 1200, 179, 1799, 2999),
('550e8400-e29b-41d4-a716-446655440802', '550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440202', 'Leather Handbag', 'FASH-002', 1, 8999, 3500, 539, 5499, 8999);

-- Insert sample orders for Home & Garden
INSERT INTO orders (id, store_id, order_number, customer_email, customer_name, status, subtotal_cents, tax_cents, shipping_cents, total_cents, commission_cents, profit_cents) VALUES
('550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440003', '000001', 'mike@example.com', 'Mike Wilson', 'processing', 16998, 1699, 1000, 19697, 764, 8499);

-- Insert sample order items for Home & Garden
INSERT INTO order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price_cents, unit_cost_cents, commission_cents, profit_cents, total_cents) VALUES
('550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440301', 'Garden Tool Set', 'HOME-001', 1, 7999, 3200, 359, 4799, 7999),
('550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440901', '550e8400-e29b-41d4-a716-446655440302', 'Kitchen Mixer', 'HOME-002', 1, 12999, 5200, 584, 7799, 12999);

-- Insert sample shipments
INSERT INTO shipments (id, store_id, order_id, carrier, tracking_number, status, label_url) VALUES
('550e8400-e29b-41d4-a716-446655441101', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440501', 'FedEx', 'FX123456789', 'delivered', 'https://example.com/labels/fedex-123456789.pdf'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440502', 'UPS', 'UP987654321', 'in_transit', 'https://example.com/labels/ups-987654321.pdf'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440701', 'DHL', 'DH456789123', 'delivered', 'https://example.com/labels/dhl-456789123.pdf');

-- Insert sample invoices
INSERT INTO invoices (id, store_id, subscription_id, invoice_number, amount_cents, currency, status, due_date, items) VALUES
('550e8400-e29b-41d4-a716-446655441201', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440401', '000001', 9900, 'USD', 'paid', '2024-01-01', '[{"description": "Pro Plan - Monthly", "amount": 9900, "quantity": 1}]'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440402', '000001', 2900, 'USD', 'paid', '2024-01-01', '[{"description": "Basic Plan - Monthly", "amount": 2900, "quantity": 1}]'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440403', '000001', 9900, 'USD', 'paid', '2024-01-01', '[{"description": "Pro Plan - Monthly", "amount": 9900, "quantity": 1}]');

-- Note: user_store_map entries will be created when users sign up and are assigned to stores
-- This is typically done through the application logic, not seed data
