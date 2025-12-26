import axios from 'axios';

const API = axios.create({
  baseURL: 'https://suhailvs.pythonanywhere.com/api/v1',
  // baseURL: 'http://172.17.3.167:8000/api/v1', 
});

const user_data = JSON.parse(localStorage.getItem('user'))
if (user_data) {
  API.defaults.headers.common['Authorization'] = `Token ${user_data['key']}`;
}
export default API;
