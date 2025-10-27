import axios from 'axios';
import type { Property } from '../store/app';

// Configure once (swap with your real endpoints later)
export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
});

// Fake endpoints for now (replace with your Supabase/Edge funcs later)
export async function fetchFeatured(): Promise<Property[]> {
  return [
    { id:'p1', image:'/sandbox/IMG-SANDBOX_1.jpg', price:'$1,249,000', beds:3, baths:2, sqft:'1,650 sqft', address:'123 Maple St', hood:'Vancouver' },
    { id:'p2', image:'/sandbox/IMG-SANDBOX_2.jpg', price:'$749,000',  beds:2, baths:2, sqft:'980 sqft',  address:'88 Queen St', hood:'Toronto' },
    { id:'p3', image:'/sandbox/IMG-SANDBOX_3.jpg', price:'$899,000',  beds:3, baths:3, sqft:'1,420 sqft', address:'16 Oak Dr',   hood:'Mississauga' },
    { id:'p4', image:'/sandbox/IMG-SANDBOX_4.jpg', price:'$1,099,000',beds:4, baths:3, sqft:'2,050 sqft', address:'72 River Rd', hood:'Oakville' },
    { id:'p5', image:'/sandbox/IMG-SANDBOX_5.jpg', price:'$629,000',  beds:1, baths:1, sqft:'720 sqft',  address:'901 King St', hood:'Toronto' },
    { id:'p6', image:'/sandbox/IMG-SANDBOX_2.jpg', price:'$1,349,000',beds:4, baths:4, sqft:'2,250 sqft', address:'5 Cedar Ct',  hood:'Vaughan' },
    { id:'p7', image:'/sandbox/IMG-SANDBOX_3.jpg', price:'$679,000',  beds:2, baths:2, sqft:'840 sqft',  address:'22 Bay St',   hood:'Toronto' },
    { id:'p8', image:'/sandbox/IMG-SANDBOX_1.jpg', price:'$1,499,000',beds:5, baths:4, sqft:'2,600 sqft', address:'11 Park Ln',  hood:'Richmond Hill' },
  ];
}
