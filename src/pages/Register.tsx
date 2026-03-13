// Register is now handled inside Login.tsx (split-card design).
// This redirect ensures any /register route lands on the unified page.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/login', { replace: true }); }, [navigate]);
  return null;
}
