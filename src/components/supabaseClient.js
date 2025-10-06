import { createClient } from '@supabase/supabase-js';

// Sustituye estos valores con los de tu proyecto
const supabaseUrl = 'https://osipkmlmyycftbtctssa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zaXBrbWxteXljZnRidGN0c3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDAsImV4cCI6MjA3MjM5OTYwMH0.Fb4I03OpXgFtlme0a6JLrngbCRja3brDoV1nwq0oTS8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);