import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className={`fixed inset-0 flex items-center justify-center bg-background transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <h1 className="text-4xl md:text-6xl font-bold text-foreground">AMANABI ENT.</h1>
    </div>
  );
};

export default LoadingAnimation;