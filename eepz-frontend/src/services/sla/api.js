export const API_BASE_URL = "";

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);

  return response.json();
};
