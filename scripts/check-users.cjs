const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllUsers() {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    console.log('📊 כל המשתמשים ב-auth.users:', data.users.length);
    console.log('');

    const verified = data.users.filter(u => u.email_confirmed_at);
    const unverified = data.users.filter(u => !u.email_confirmed_at);

    console.log('✅ מאומתים (' + verified.length + '):');
    verified.forEach(u => console.log('   - ' + u.email));

    console.log('');
    console.log('⏳ ממתינים לאימות (' + unverified.length + '):');
    unverified.forEach(u => {
        const date = new Date(u.created_at).toLocaleDateString('he-IL');
        console.log('   - ' + u.email + ' (נרשם: ' + date + ')');
    });
}

checkAllUsers().catch(e => console.log('Error:', e.message));
