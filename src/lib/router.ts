import { useEffect, useState } from 'react';

export function currentPath(): string {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useCurrentPath(): string {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const handle = () => setPath(currentPath());
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);

  return path;
}
