
import axios from 'axios';
    
export const authAPI = {
  async googleSignIn(profileURL) {
    const response = await axios.post(`https://lipin.onrender.com/signin`, {
      profileURL:profileURL
    });
    return response.data;
  }
};