import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "{{https://aegpswfduxjayoeidztz.supabase.co}}";
const SUPABASE_ANON_KEY = "{{eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZ3Bzd2ZkdXhqYXlvZWlkenR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NjM1NjksImV4cCI6MjA5OTAzOTU2OX0.RynRoVplA-Vs2XKCRW9eEl0NmVlTAS9Wg6JeG4qcYns}}";

// Clean the placeholder wrapper if left in place
const cleanUrl = SUPABASE_URL.replace(/^\{\{/, "").replace(/\}\}$/, "");
const cleanKey = SUPABASE_ANON_KEY.replace(/^\{\{/, "").replace(/\}\}$/, "");

export const supabase = createClient(cleanUrl, cleanKey);

