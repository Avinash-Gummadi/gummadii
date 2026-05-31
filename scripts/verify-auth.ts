const API_URL = 'https://gummadii.com/api';

async function testAuth() {
    console.log('--- Testing Auth Backend ---');
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'testpassword123';
    const companyName = 'Test Corp';

    try {
        // 1. Signup
        console.log(`\n[1] Registering ${email}...`);
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, companyName })
        });
        const signupData = await signupRes.json() as any;
        if (!signupRes.ok) throw new Error(JSON.stringify(signupData));
        console.log('✅ Signup Success:', signupData.message);
        const token = signupData.token;

        // 2. Login
        console.log('\n[2] Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json() as any;
        if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
        console.log('✅ Login Success:', loginData.message);
        const loginToken = loginData.token;

        // 3. Test Protected Route (Create Client)
        console.log('\n[3] Creating client in cloud...');
        const clientRes = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginToken}`
            },
            body: JSON.stringify({ name: 'John Doe', phone: '1234567890' })
        });
        const clientData = await clientRes.json() as any;
        if (!clientRes.ok) throw new Error(JSON.stringify(clientData));
        console.log('✅ Client Created:', clientData.name, '(ID:', clientData.id, ')');

        // 4. Test Isolation (Create 2nd User)
        const email2 = `otheruser_${Date.now()}@example.com`;
        console.log(`\n[4] Registering secondary user ${email2}...`);
        const signupRes2 = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email2, password, companyName: 'Other Ltd' })
        });
        const signupData2 = await signupRes2.json() as any;
        if (!signupRes2.ok) throw new Error(JSON.stringify(signupData2));
        const token2 = signupData2.token;

        // 5. Try to fetch 1st user's client with 2nd user's token
        console.log('\n[5] Testing data isolation (User 2 fetching User 1 data)...');
        const clientsRes2 = await fetch(`${API_URL}/clients`, {
            headers: { 'Authorization': `Bearer ${token2}` }
        });
        const clientsData2 = await clientsRes2.json() as any;

        if (clientsData2.length === 0) {
            console.log('✅ ISOLATION VERIFIED: User 2 cannot see User 1 clients.');
        } else {
            console.error('❌ ISOLATION FAILED: User 2 sees data from other users!');
        }

        console.log('\n--- Auth Verification Complete! ---');

    } catch (error: any) {
        console.error('❌ Interaction Failed:', error.message);
    }
}

testAuth();
