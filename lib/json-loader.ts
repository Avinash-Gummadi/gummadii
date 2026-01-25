import fs from 'fs/promises';
import path from 'path';

export interface Group {
  id: string;
  name: string;
  description: string;
  foundedYear?: number;
  logo?: string;
}

export interface Business {
  id: string;
  groupId: string;
  name: string;
  domain?: string;
  slug: string;
  logo: string;
  shortDescription: string;
  description: string;
  services: { title: string; description: string }[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
   contact: {
    email: string;
    phone: string;
  }
}

export interface PageContent {
    [key: string]: any;
}

export interface SEOConfig {
    default: any;
}

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    // Return default/empty if file missing?? For now throw to debug.
    throw new Error(`Failed to read data from ${filename}`);
  }
}

export async function getGroups(): Promise<Group[]> {
  return readJson<Group[]>('groups.json');
}

export async function getBusinesses(): Promise<Business[]> {
  return readJson<Business[]>('businesses.json');
}

export async function getBusinessBySlug(slug: string): Promise<Business | undefined> {
  const businesses = await getBusinesses();
  return businesses.find(b => b.slug === slug);
}

export async function getPages(): Promise<PageContent> {
  return readJson<PageContent>('pages.json');
}

export async function getSEO(): Promise<SEOConfig> {
  return readJson<SEOConfig>('seo.json');
}

// Write functions for Admin
export async function saveJson(filename: string, content: any): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf-8');
}
