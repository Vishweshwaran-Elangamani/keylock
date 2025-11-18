import { useEffect, useState } from "react";

export const useFetch = (url) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())

      .then((result) => setData(result))

      .catch(console.error);
  }, [url]);

  return data;
};
