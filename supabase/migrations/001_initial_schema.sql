-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'staff', 'viewer');
CREATE TYPE system_user_role AS ENUM ('super_admin', 'admin');
CREATE TYPE store_status AS ENUM ('active', 'suspended', 'inactive');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'expired', 'canceled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'draft');
CREATE TYPE shipment_status AS ENUM ('pending', 'in_transit', 'delivered', 'failed', 'returned');
CREATE TYPE invoice_payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Create stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    status store_status DEFAULT 'active',
    commission_bps INTEGER DEFAULT 500, -- 5% default commission
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system users table (for admin access)
CREATE TABLE system_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role system_user_role DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_store_map table (multi-tenancy)
CREATE TABLE user_store_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL, -- 'basic', 'pro', 'enterprise'
    status subscription_status DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    grace_days INTEGER DEFAULT 7,
    price_cents INTEGER NOT NULL, -- Price in cents
    currency VARCHAR(3) DEFAULT 'USD',
    interval VARCHAR(20) DEFAULT 'month', -- 'month', 'year'
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100),
    category VARCHAR(100),
    status product_status DEFAULT 'active',
    base_price_cents INTEGER NOT NULL,
    unit_cost_cents INTEGER DEFAULT 0,
    commission_bps INTEGER, -- Override store default
    image_urls TEXT[], -- Array of image URLs
    metadata JSONB, -- For variants, attributes, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL, -- Store-scoped sequential
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    status order_status DEFAULT 'pending',
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER DEFAULT 0,
    shipping_cents INTEGER DEFAULT 0,
    total_cents INTEGER NOT NULL,
    commission_cents INTEGER NOT NULL DEFAULT 0,
    profit_cents INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, order_number)
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Snapshot at time of order
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    unit_cost_cents INTEGER NOT NULL DEFAULT 0,
    commission_cents INTEGER NOT NULL DEFAULT 0,
    profit_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipments table
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(255),
    status shipment_status DEFAULT 'pending',
    label_url TEXT,
    external_id VARCHAR(255), -- Provider's shipment ID
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- Provider-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL, -- Store-scoped sequential
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status invoice_payment_status DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    items JSONB, -- Invoice line items
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, invoice_number)
);

-- Create indexes for performance
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_user_store_map_user_id ON user_store_map(user_id);
CREATE INDEX idx_user_store_map_store_id ON user_store_map(store_id);
CREATE INDEX idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_shipments_store_id ON shipments(store_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_invoices_store_id ON invoices(store_id);
CREATE INDEX idx_invoices_status ON invoices(invoice_payment_status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_users_updated_at BEFORE UPDATE ON system_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_store_map_updated_at BEFORE UPDATE ON user_store_map FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create sequential numbering functions
CREATE OR REPLACE FUNCTION get_next_order_number(store_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '^[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders
    WHERE store_id = get_next_order_number.store_id;
    
    RETURN LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_next_invoice_number(store_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '^[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE store_id = get_next_invoice_number.store_id;
    
    RETURN LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_store_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Stores RLS policies
CREATE POLICY "Stores are viewable by store users" ON stores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = stores.id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "Stores are editable by store owners and admins" ON stores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = stores.id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role IN ('owner', 'admin')
        )
    );

-- System users RLS policies (super admin only)
CREATE POLICY "System users viewable by super admin" ON system_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM system_users
            WHERE system_users.id = auth.uid()
            AND system_users.role = 'super_admin'
        )
    );

CREATE POLICY "System users editable by super admin" ON system_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM system_users
            WHERE system_users.id = auth.uid()
            AND system_users.role = 'super_admin'
        )
    );

-- User store map RLS policies
CREATE POLICY "User store map viewable by store users" ON user_store_map
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = user_store_map.store_id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "User store map editable by store owners and admins" ON user_store_map
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = user_store_map.store_id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role IN ('owner', 'admin')
        )
    );

-- Subscriptions RLS policies
CREATE POLICY "Subscriptions viewable by store users" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = subscriptions.store_id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "Subscriptions editable by store owners and admins" ON subscriptions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = subscriptions.store_id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role IN ('owner', 'admin')
        )
    );

-- Products RLS policies
CREATE POLICY "Products viewable by store users" ON products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = products.store_id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "Products editable by store users (not viewers)" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = products.store_id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role != 'viewer'
        )
    );

-- Orders RLS policies
CREATE POLICY "Orders viewable by store users" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = orders.store_id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "Orders editable by store users (not viewers)" ON orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = orders.store_id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role != 'viewer'
        )
    );

-- Order items RLS policies
CREATE POLICY "Order items viewable by store users" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN user_store_map ON user_store_map.store_id = orders.store_id
            WHERE orders.id = order_items.order_id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "Order items editable by store users (not viewers)" ON order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN user_store_map ON user_store_map.store_id = orders.store_id
            WHERE orders.id = order_items.order_id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role != 'viewer'
        )
    );

-- Shipments RLS policies
CREATE POLICY "Shipments viewable by store users" ON shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = shipments.store_id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "Shipments editable by store users (not viewers)" ON shipments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = shipments.store_id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role != 'viewer'
        )
    );

-- Invoices RLS policies
CREATE POLICY "Invoices viewable by store users" ON invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = invoices.store_id
            AND user_store_map.user_id = auth.uid()
        )
    );

CREATE POLICY "Invoices editable by store owners and admins" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_store_map
            WHERE user_store_map.store_id = invoices.store_id
            AND user_store_map.user_id = auth.uid()
            AND user_store_map.role IN ('owner', 'admin')
        )
    );

-- Create refresh_subscriptions function for cron
CREATE OR REPLACE FUNCTION refresh_subscriptions()
RETURNS TABLE(
    subscription_id UUID,
    store_id UUID,
    old_status subscription_status,
    new_status subscription_status,
    action_taken TEXT
) AS $$
DECLARE
    subscription_record RECORD;
    now_date DATE := CURRENT_DATE;
    action TEXT;
BEGIN
    FOR subscription_record IN 
        SELECT * FROM subscriptions 
        WHERE status = 'active' 
        AND end_date < now_date
    LOOP
        -- Check if past grace period
        IF subscription_record.end_date + subscription_record.grace_days < now_date THEN
            -- Past grace period - expire subscription and suspend store
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE id = subscription_record.id;
            
            UPDATE stores 
            SET status = 'suspended' 
            WHERE id = subscription_record.store_id;
            
            action := 'expired_and_suspended';
        ELSE
            -- Within grace period - mark as past due
            UPDATE subscriptions 
            SET status = 'past_due' 
            WHERE id = subscription_record.id;
            
            action := 'marked_past_due';
        END IF;
        
        -- Return the change
        subscription_id := subscription_record.id;
        store_id := subscription_record.store_id;
        old_status := subscription_record.status;
        new_status := CASE 
            WHEN action = 'expired_and_suspended' THEN 'expired'::subscription_status
            ELSE 'past_due'::subscription_status
        END;
        action_taken := action;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
