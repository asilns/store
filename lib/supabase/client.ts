import { createBrowserClient } from '@supabase/ssr';

// Create client with proper SSR cookie handling
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Export for usage in pages and components
export default supabase;
