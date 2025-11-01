import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      
      const navigateTimer = setTimeout(() => {
        navigate('/login');
      }, 1000);

      return () => clearTimeout(navigateTimer);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`loading-container bg-background ${isVisible ? 'fade-in' : 'fade-out'}`}>
      <img 
        src={`${import.meta.env.BASE_URL}Amanabi.png`} 
        alt="Amanabi Logo" 
        className="loading-logo"
      />
    </div>
  );
};

export default LoadingAnimation;