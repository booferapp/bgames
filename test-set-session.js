const { createClient } = require('@supabase/supabase-js')

// Override global fetch to intercept requests
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  console.log(`\n>>> HTTP REQUEST: ${options.method || 'GET'} ${url}`);
  if (options.headers) {
    console.log('Headers:', JSON.stringify(options.headers, null, 2));
  }
  if (options.body) {
    console.log('Body:', options.body);
  }
  
  try {
    const response = await originalFetch(url, options);
    console.log(`<<< HTTP RESPONSE: ${response.status} ${response.statusText}`);
    const clonedResponse = response.clone();
    try {
      const text = await clonedResponse.text();
      console.log('Response Body:', text);
    } catch (e) {
      console.log('Could not read response body');
    }
    return response;
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
};

const supabaseUrl = 'https://fvjdohkfaxomtosiibua.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2amRvaGtmYXhvbXRvc2lpYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MDM3NDgsImV4cCI6MjA4NjQ3OTc0OH0.TNcqAUqLFPWpfYI-6RZjVQ25eyXGBEluzTd9Ps-RRXs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runTest() {
  const { data, error } = await supabase
    .from('web_auth_sessions')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Failed to fetch session:', error)
    return
  }

  try {
    console.log('Calling supabase.auth.setSession...');
    const res = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token
    })

    console.log('\nsetSession result:', JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('\nsetSession THREW AN ERROR:', err)
  }
}

runTest()
