import { useEffect, useState } from "react";
import api from "../services/api";

/**
 * useFetch — reusable data-fetching hook for GET endpoints.
 * 
 * Example:
 * const { data, loading, error, refetch } = useFetch("/FormManagement/all");
 */
export default function useFetch(endpoint, params = null, auto = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint, { params });
      setData(response.data?.data ?? response.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch once if auto = true
  useEffect(() => {
    if (auto) fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
}