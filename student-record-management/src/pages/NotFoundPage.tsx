import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      <h1 className="text-8xl font-bold text-gray-200 dark:text-gray-700">404</h1>
      <h2 className="text-3xl font-semibold mt-4">Page Not Found</h2>
      <p className="text-gray-500 mt-2 mb-8">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary flex items-center gap-2">
        <Home size={20} />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;