// services.js
const TMDB_API_KEY = '5c1853c10d9752023da5ddce4ada3b77';
const BASE_URL = 'https://api.themoviedb.org/3';

const fetchTMDB = async (endpoint) => {
  try {
    const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}&language=pt-BR`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API TMDB: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Falha ao buscar dados do TMDB:', error);
    throw error;
  }
};

export const getFilmesEmAlta = () => fetchTMDB('/trending/movie/week');
export const getSeriesEmAlta = () => fetchTMDB('/trending/tv/week');