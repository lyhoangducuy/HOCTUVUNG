import { Outlet } from 'react-router-dom';
import Header from '../../components/Auth/Header';
import Footer from '../../components/Auth/Footer/Footer';
import AuthSync from '../../components/Auth/AuthSync';


export default function AuthLayout() {
  return (
    <div>
      <Header />
      <AuthSync />
      <Outlet />
      <Footer />
    </div>
  );
}
