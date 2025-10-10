import Cart from '../components/Cart.jsx'
import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from '../hooks/useTotalHeaderHeight';

export default function CartPage() {
  const totalHeaderHeight = useTotalHeaderHeight();
  return (
    <>
      <BreadcrumbNav
        currentPage="Shopping Cart"
        backButton={{ label: "Continue Shopping", path: "/" }}
      />
      <div className="container" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <Cart />
      </div>
    </>
  );
}
