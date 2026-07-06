import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export const getMyOffers = () => api.get('/offers/mine');
export const respondToOffer = (offerId: string, status: 'ACCEPTED' | 'DECLINED') =>
  api.patch(`/offers/${offerId}`, { status });
export const checkIn = (data: {
  requestId: string;
  siteId: string;
  lat: number;
  lng: number;
  selfieUrl: string;
}) => api.post('/checkins', data);
export const checkOut = (checkInId: string) => api.patch(`/checkins/${checkInId}/checkout`);
export const getMyCheckins = () => api.get('/checkins/mine');
export const getMyProfile = () => api.get('/workers/me');
export const updateMyProfile = (data: any) => api.patch('/workers/me', data);

export default api;
