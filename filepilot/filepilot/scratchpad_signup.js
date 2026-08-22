const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pjdtlbrfagtvxphqgukc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZHRsYnJmYWd0dnhwaHFndWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTY2NDIsImV4cCI6MjA5OTA5MjY0Mn0.cixXIzXlDygQcgKhnjl0dxhsdDcOBaEjRJqf2E58vY0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Attempting sign in...');
  const res1 = await supabase.auth.signInWithPassword({
    email: 'adminmaster@norehq.com',
    password: 'Mandi@123'
  });
  console.log('SignIn Result:', JSON.stringify(res1, null, 2));

  if (res1.error) {
    console.log('Attempting sign up...');
    const res2 = await supabase.auth.signUp({
      email: 'adminmaster@norehq.com',
      password: 'Mandi@123'
    });
    console.log('SignUp Result:', JSON.stringify(res2, null, 2));
    
    // Try sign in again
    const res3 = await supabase.auth.signInWithPassword({
        email: 'adminmaster@norehq.com',
        password: 'Mandi@123'
    });
    console.log('SignIn after SignUp Result:', JSON.stringify(res3, null, 2));
  }
}

run();
