import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('supreme_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getToken() {
  return localStorage.getItem('supreme_token');
}

export function logout() {
  localStorage.removeItem('supreme_token');
  localStorage.removeItem('supreme_user');
}

export async function loginAdmin(values) {
  const response = await api.post('/auth/login', values);
  return response.data;
}

export async function fetchEmployees(params) {
  const response = await api.get('/employees', { params });
  return response.data;
}

export async function fetchRegions() {
  const response = await api.get('/regions');
  return response.data;
}

export async function fetchDistricts(params) {
  const response = await api.get('/districts', { params });
  return response.data;
}

export async function fetchStats() {
  const [summary, regions, districts, top] = await Promise.all([
    api.get('/stats/summary'),
    api.get('/stats/regions'),
    api.get('/stats/districts'),
    api.get('/stats/top'),
  ]);
  return { summary: summary.data, regions: regions.data, districts: districts.data, top: top.data };
}

export async function fetchAdmins() {
  const response = await api.get('/admins');
  return response.data;
}

export async function createAdmin(values) {
  const response = await api.post('/admins', values);
  return response.data;
}

export async function updateAdmin(id, values) {
  const response = await api.put(`/admins/${id}`, values);
  return response.data;
}

export async function deleteAdmin(id) {
  await api.delete(`/admins/${id}`);
}

export async function fetchEmployeesForAdmin() {
  const response = await api.get('/employees');
  return response.data;
}

export async function createEmployee(values) {
  const response = await api.post('/employees', values);
  return response.data;
}

export async function updateEmployee(id, values) {
  const response = await api.put(`/employees/${id}`, values);
  return response.data;
}

export async function deleteEmployee(id) {
  await api.delete(`/employees/${id}`);
}

export async function createRegion(values) {
  const response = await api.post('/regions', values);
  return response.data;
}

export async function updateRegion(id, values) {
  const response = await api.put(`/regions/${id}`, values);
  return response.data;
}

export async function deleteRegion(id) {
  await api.delete(`/regions/${id}`);
}

export async function createDistrict(values) {
  const response = await api.post('/districts', values);
  return response.data;
}

export async function updateDistrict(id, values) {
  const response = await api.put(`/districts/${id}`, values);
  return response.data;
}

export async function deleteDistrict(id) {
  await api.delete(`/districts/${id}`);
}

export async function fetchPositions() {
  const response = await api.get('/positions');
  return response.data;
}

export async function createPosition(values) {
  const response = await api.post('/positions', values);
  return response.data;
}

export async function updatePosition(id, values) {
  const response = await api.put(`/positions/${id}`, values);
  return response.data;
}

export async function deletePosition(id) {
  await api.delete(`/positions/${id}`);
}

export async function fetchRegionAdmins() {
  const response = await api.get('/admins');
  return response.data;
}
