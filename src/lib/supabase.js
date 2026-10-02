// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cosvznincguvfegbvzlu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvc3Z6bmluY2d1dmZlZ2J2emx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTI5MzEsImV4cCI6MjEwNDg4ODkzMX0.JiilpMuZZ5BCITn4jjfrMTRvOiT6GnbzeD4fmVFG-iU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);