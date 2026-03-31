// Central API config — reads from .env in dev, .env.production in build
export const API    = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const AI_URL = import.meta.env.VITE_AI_URL  || 'http://localhost:8000';
