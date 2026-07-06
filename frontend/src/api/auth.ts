import axios from "axios";

const API_BASE_URL = "http://localhost:3001/v1/api";

export const signinCall = async (email: string, password: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signin`, {
    email,
    password,
  });
  return response.data;
};

export const signupCall = async (email: string, password: string, name: string) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
    email,
    password,
    name,
  });
  return response.data;
};
