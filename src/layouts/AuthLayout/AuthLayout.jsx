import { Outlet } from 'react-router-dom';
import Header from '../../components/Auth/Header';
import Footer from '../../components/Auth/Footer/Footer';


export default function AuthLayout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
