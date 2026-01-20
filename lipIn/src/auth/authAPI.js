
import axios from 'axios';
    
export const authAPI = {
  async googleSignIn(profileURL) {
    const response = await axios.post(`http://127.0.0.1:8000/signin`, {
      profileURL:profileURL
    });
    return response.data;
  }
};