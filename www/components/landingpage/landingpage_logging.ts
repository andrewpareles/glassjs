import { createClient } from '@supabase/supabase-js';

const supabase_public_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZGxjZ2tkZmlkbXp6Ymtua3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk3Mjg4NTcsImV4cCI6MjAzNTMwNDg1N30.dnnr8jWWLMt9XpkijWaTxzIkdRi7t801IoIr6SEKi7g';
const supabase_url = 'https://andlcgkdfidmzzbknkyg.supabase.co';

const supabase = createClient(supabase_url, supabase_public_key);

// log user email for waitlist
export const logUserEmail = async (email: string) => {
    try {
        const { data, error } = await supabase
            .from('waitlist_emails')
            .insert({
                email: email,
            });
    } catch (error) {
        console.error('Unexpected error logging user email:', error);
    }
};

