import axios from 'axios';

// Create an instance of Axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:5003',  // Your API's base URL
});

// Add a response interceptor to handle 401 errors (JWT expiration)
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Dispatch the sessionExpired event
      window.dispatchEvent(new Event('sessionExpired'));  
    }
    return Promise.reject(error);  // Forward the error to the next handler
  }
);

export default axiosInstance;
