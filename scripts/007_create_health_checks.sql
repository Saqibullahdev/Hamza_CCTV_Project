-- Create a simple table to record health checks
CREATE TABLE IF NOT EXISTS public.keep_alive (
    id SERIAL PRIMARY KEY,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

-- Allow the authenticated service role to insert and read
CREATE POLICY "Allow service role access" ON public.keep_alive
    USING (true)
    WITH CHECK (true);

-- Insert an initial record
INSERT INTO public.keep_alive (checked_at) VALUES (NOW());
