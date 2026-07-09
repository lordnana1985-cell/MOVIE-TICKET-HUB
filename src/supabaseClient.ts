import { createClient } from "@supabase/supabase-js";

// ============================================================================
// SUPABASE CONFIGURATION
// Replace the values below with your actual Supabase URL and Anon Key
// ============================================================================

// Pasted from user instructions (Replace these strings whenever you want)
const SUPABASE_URL = "https://aegpswfduxjayoeidztz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZ3Bzd2ZkdXhqYXlvZWlkenR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NjM1NjksImV4cCI6MjA5OTAzOTU2OX0.RynRoVplA-Vs2XKCRW9eEl0NmVlTAS9Wg6JeG4qcYns";

// Export the initialized Supabase client for use in the app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
