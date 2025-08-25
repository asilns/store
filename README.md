# Multi-Tenant Orders Dashboard

A comprehensive SaaS platform for managing multi-tenant e-commerce operations with strong Row-Level Security (RLS), built on Next.js 15 and Supabase.

## 🚀 Features

### Seller Area

- **Orders Management**: Complete CRUD operations with commission/profit calculations
- **Products Management**: Product catalog with variants and categories
- **Shipments Tracking**: Carrier integration and status management
- **Reports & Analytics**: Sales trends, profit analysis, and performance metrics
- **Billing & Subscriptions**: Subscription management and invoice generation
- **User Management**: Role-based access control within stores
- **CSV Import/Export**: Bulk operations for orders and products

### Admin Area

- **Store Management**: Create, suspend, and manage stores
- **Subscription Management**: Manual subscription control with immediate updates
- **Invoice Generation**: HTML to PDF conversion with Arabic support
- **System Monitoring**: Platform-wide metrics and health checks

### Security & Multi-tenancy

- **Row-Level Security (RLS)**: Complete data isolation between stores
- **Role-Based Access Control**: Owner, Admin, Manager, Staff, Viewer roles
- **Multi-store Support**: Users can belong to multiple stores with different roles
- **Service-role Keys**: Server-only access for admin operations

### Internationalization

- **Multi-language Support**: English and Arabic
- **RTL Support**: Full right-to-left layout support
- **Localized Content**: Dates, numbers, and currency formatting

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Storage)
- **PDF Generation**: Puppeteer + Chromium for HTML to PDF conversion
- **Hosting**: Vercel with Cron jobs
- **Database**: PostgreSQL with advanced RLS policies

## 📋 Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn
- Supabase account and project
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd multi-tenant-orders-dashboard
npm install
```

### 2. Environment Setup

Create a `.env.local` file with your configuration:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the contents of `supabase/seed.sql` for sample data

#### Option B: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your_project_ref

# Run migrations
supabase db push

# Seed data
supabase db reset
```

### 4. Storage Bucket Setup

Create a private storage bucket in Supabase:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `private`
3. Set it as private
4. Update RLS policies for the bucket

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

### Core Tables

- **stores**: Store information and settings
- **users**: System users (admin accounts)
- **user_store_map**: Multi-tenant user-store relationships
- **subscriptions**: Store subscription plans
- **products**: Product catalog with variants
- **orders**: Order management with commission tracking
- **order_items**: Individual order line items
- **shipments**: Shipping and tracking information
- **invoices**: Billing and invoice management

### Key Features

- **Sequential Numbering**: Store-scoped order and invoice numbers
- **Commission Calculation**: Automatic profit and commission tracking
- **RLS Policies**: Complete data isolation between stores
- **Audit Trail**: Created/updated timestamps on all tables

## 🔐 Security & RLS

### Row-Level Security Policies

- **Stores**: Users can only access stores they belong to
- **Products**: Store-scoped access with role-based permissions
- **Orders**: Complete isolation between stores
- **Invoices**: Role-based access (owners/admins only)

### Role Hierarchy

1. **Owner**: Full access to store and user management
2. **Admin**: Full access to store operations
3. **Manager**: Operational access (no user management)
4. **Staff**: Limited access (no financial data)
5. **Viewer**: Read-only access

### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. User is assigned to stores via `user_store_map`
3. RLS policies enforce store isolation
4. API routes verify store context and permissions

## 📊 CSV Operations

### Export

- **Orders**: Complete order data with items and financials
- **Products**: Product catalog with pricing and metadata
- **Store-scoped**: Exports only contain data from user's store

### Import

- **Products**: Bulk product import with validation
- **Validation**: Per-row error reporting and validation
- **Duplicate Prevention**: SKU uniqueness enforcement
- **Error Handling**: Detailed feedback for failed imports

## 🧾 Invoice Generation

### Features

- **HTML to PDF**: Server-side PDF generation
- **Arabic Support**: RTL layout and Arabic font rendering
- **Sequential Numbering**: Store-scoped invoice numbers
- **Storage**: PDFs stored in Supabase Storage with signed URLs

### Process

1. Generate HTML invoice template
2. Convert to PDF using Puppeteer + Chromium
3. Upload to Supabase Storage
4. Generate signed download URL
5. Update invoice record with file path

## ⏰ Cron Jobs

### Daily Subscription Refresh

- **Schedule**: Daily at midnight UTC
- **Endpoint**: `/api/admin/refresh-subscriptions`
- **Function**: Updates subscription statuses based on dates
- **Actions**: Mark as past_due, expire, or suspend stores

### Implementation

```json
{
  "crons": [
    {
      "path": "/api/admin/refresh-subscriptions",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## 🌐 Internationalization

### Supported Languages

- **English (en)**: Default language
- **Arabic (ar)**: Full RTL support

### Features

- **Dynamic Direction**: Automatic RTL/LTR switching
- **Localized Formatting**: Dates, numbers, and currency
- **Translation Files**: JSON-based translation management
- **PDF Support**: Arabic text rendering in invoices

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic preview deployments

### Environment Variables

Ensure all required environment variables are set in Vercel:

- Supabase configuration
- Service role keys
- Storage bucket names

### Cron Jobs

Cron jobs are automatically configured via `vercel.json` and will run on the production deployment.

## 🧪 Testing & Verification

### RLS Isolation Testing

```sql
-- Test cross-store access (should fail)
-- Connect as user from Store A
SELECT * FROM products WHERE store_id = 'store_b_id';

-- Test same-store access (should succeed)
SELECT * FROM products WHERE store_id = 'store_a_id';
```

### API Testing

```bash
# Test store-scoped access
curl -H "Authorization: Bearer $TOKEN" \
  "https://your-app.vercel.app/api/store/products?store_id=store_id"

# Test admin endpoints
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://your-app.vercel.app/api/admin/stores"
```

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── (store)/                 # Store-level pages
│   │   ├── dashboard/           # Store dashboard
│   │   ├── orders/              # Order management
│   │   ├── products/            # Product catalog
│   │   ├── shipments/           # Shipping management
│   │   ├── reports/             # Analytics & reports
│   │   ├── billing/             # Subscription & billing
│   │   ├── users/               # User management
│   │   └── settings/            # Store settings
│   ├── admin/                   # Admin-level pages
│   │   ├── stores/              # Store management
│   │   ├── subscriptions/       # Subscription control
│   │   ├── invoices/            # Invoice management
│   │   └── settings/            # Platform settings
│   └── api/                     # API routes
│       ├── store/               # Store-level APIs
│       └── admin/               # Admin-level APIs
├── components/                   # Reusable UI components
├── lib/                         # Utility libraries
│   ├── supabase/                # Supabase client configuration
│   ├── auth/                    # Authentication utilities
│   └── i18n/                    # Internationalization
├── supabase/                    # Database migrations and seed data
│   ├── migrations/              # SQL schema migrations
│   └── seed.sql                 # Sample data
├── public/                      # Static assets
│   └── locales/                 # Translation files
└── vercel.json                  # Vercel configuration
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Adding New Features

1. **Database**: Add migrations in `supabase/migrations/`
2. **API**: Create routes in `app/api/`
3. **Frontend**: Add pages in appropriate directory
4. **Types**: Update `lib/types/index.ts`
5. **Translations**: Add keys to locale files

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Automatic code formatting
- **Components**: Functional components with hooks

## 🐛 Troubleshooting

### Common Issues

#### RLS Policy Errors

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'products';
```

#### Authentication Issues

- Verify Supabase environment variables
- Check user store mapping
- Verify RLS policies are enabled

#### PDF Generation Issues

- Ensure Chromium is available
- Check storage bucket permissions
- Verify invoice data exists

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` and checking browser console and server logs.

## 📈 Performance

### Optimization Features

- **Database Indexes**: Optimized for common queries
- **RLS Efficiency**: Minimal overhead from security policies
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based code splitting

### Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Database performance metrics
- **Error Tracking**: Comprehensive error logging

## 🔒 Security Considerations

### Data Protection

- **RLS**: Complete data isolation between tenants
- **API Security**: Server-side validation and authorization
- **File Storage**: Private storage with signed URLs
- **Authentication**: Supabase Auth with secure session management

### Best Practices

- Never expose service role keys in client code
- Always verify store context in API routes
- Use parameterized queries to prevent SQL injection
- Implement rate limiting for public endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Add proper error handling
- Include translations for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

### Community

- **Discord**: Join our community server
- **Email**: Contact support@example.com
- **GitHub**: Star and watch the repository

## 🗺️ Roadmap

### Milestone 1 (Current)

- ✅ Basic CRUD operations
- ✅ RLS implementation
- ✅ Multi-tenant architecture
- ✅ CSV export functionality
- ✅ Basic admin interface

### Milestone 2 (Next)

- 🔄 Advanced analytics
- 🔄 Multi-carrier shipping
- 🔄 Advanced reporting
- 🔄 Mobile app
- 🔄 API documentation

### Future Enhancements

- 🚀 AI-powered insights
- 🚀 Advanced automation
- 🚀 Multi-currency support
- 🚀 Advanced integrations

---

**Built with ❤️ using Next.js and Supabase**
