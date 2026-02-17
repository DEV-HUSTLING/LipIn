import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const authAPI = {
  async googleSignIn(profileURL) {
    const response = await axios.post(`${API_URL}/signin`, {
      profileURL:profileURL
    });
    return response.data;
  }
};