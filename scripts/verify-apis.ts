// scripts/verify-apis.ts

const BASE_URL = 'https://gummadii.com/api';

async function verifyAPIs() {
    console.log('--- API Verification Test ---');
    console.log('Ensure "npm run dev" is running in gummadii before starting.\n');

    try {
        // 1. Test Clients API
        console.log('Testing Clients API (POST)...');
        const clientRes = await fetch(`${BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Client',
                email: 'test@example.com',
                notes: 'Verification test'
            })
        });
        const clientData = await clientRes.json();
        console.log('✅ Client created:', clientData.id);

        // 2. Test Products API
        console.log('\nTesting Products API (POST)...');
        const productRes = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Product',
                price: 199.99,
                unit: 'pcs'
            })
        });
        const productData = await productRes.json();
        console.log('✅ Product created:', productData.id);

        // 3. Test Profile API
        console.log('\nTesting Business Profile API (GET)...');
        const profileRes = await fetch(`${BASE_URL}/profile`);
        const profileData = await profileRes.json();
        console.log('✅ Profile fetched:', profileData.business_name || 'Empty Profile');

        console.log('\n--- VERIFICATION COMPLETED ---');
    } catch (err: any) {
        console.error('\n❌ VERIFICATION FAILED');
        console.error('Error:', err.message);
    }
}

verifyAPIs();
