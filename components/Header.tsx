import Link from 'next/link';
import { getBusinesses } from '@/lib/json-loader';
import Navbar from './Navbar';

export default async function Header() {
    const businesses = await getBusinesses();

    return <Navbar businesses={businesses} />;
}
