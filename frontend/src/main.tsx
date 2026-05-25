import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'swiper/css';
import 'swiper/css/navigation';

createRoot(document.getElementById('root')!).render(
    <App />
)
