import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        console.error('No token provided');
        return navigate('/verify-failed');
      }

      try {
        console.log('Sending verification request...');
        const response = await axios.get(
          `http://localhost:5000/api/auth/verify-email`,
          {
            params: { token },
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Verification response:', response.data);
        if (response.data.success) {
          navigate('/email-verified-success');
        } else {
          navigate('/verify-failed');
        }
      } catch (error) {
        console.error('Verification request failed:', error);
        if (error.response?.data?.redirectUrl) {
          window.location.href = error.response.data.redirectUrl;
        } else {
          navigate('/verify-failed');
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return <div>Processing verification...</div>;
};

export default VerifyEmail;