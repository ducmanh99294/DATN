import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getCart, addToCartApi, clearCartApi, deleteItems, updateCart } from '../api/cartApi';
import { useAuthContext } from './AuthContext';
import type { Product } from '../components/Product';
import { useNotify } from '../hooks/useNotification';

interface CartContextType {
  state: CartState;
  loading: boolean;
  addToCart: (productId: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  applyDiscount: (code: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export interface CartItem {
  _id: string;
  productId: Product;
  price: number;
  quantity: number;
}

interface SavedItem {
  id: number;
  productId: number;
  name: string;
  category: string;
  images: string[];
  price: number;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  // savedItems: SavedItem[];
  // discountCode: string;
  // discountAmount: number;
  // shippingCost: number;
  // taxRate: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'APPLY_DISCOUNT'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.items.find((item: CartItem) => item._id === action.payload._id);
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item: CartItem) =>
            item._id === action.payload._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter((item:CartItem) => item._id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item._id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'APPLY_DISCOUNT':
      const discountAmount = action.payload === 'SAVE10' ? 0.1 : // 10% discount
                            action.payload === 'SAVE20' ? 0.2 : // 20% discount
                            0;
      
      return {
        ...state,
        // discountCode: action.payload,
        // discountAmount
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        // discountCode: '',
        // discountAmount: 0
      };
    
    case 'LOAD_CART':
      return action.payload;
    
    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
};

const mapBackendCartToState = (data: any): CartState => {
  return {
    items: data.items.map((item: any) => ({
      _id: item._id,
      productId: item.product,
      price: item.product.price,
      quantity: item.quantity,
    })),
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {user} = useAuthContext()
  const notify = useNotify();

  useEffect(() => {
    if (!user) return; 

    const fetchCart = async () => {
      try {
        setLoading(true);
        const data = await getCart();
        dispatch({ 
          type: 'LOAD_CART', 
          payload: mapBackendCartToState(data) 
        });
      } catch (e) {
        notify.error("Không tìm thấy giỏ hàng", "Thông báo");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user]); 


  // Save cart to localStorage on update
  const addToCart = async (productId: string) => {
    if (!user) {
      notify.info("Vui lòng đăng nhập để sử dụng chức năng này", "Thông báo");
      return; // 🔥 dừng luôn
    }
    try {
      setLoading(true);
      await addToCartApi(productId);
      const data = await getCart();
      dispatch({ type: 'LOAD_CART', payload: mapBackendCartToState(data) });
      notify.success("Thêm vào giỏ hàng thành công", "Thông báo")
    } catch (e) {
      notify.error("Thêm vào giỏ hàng thất bại", "Thông báo")
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (id: string) => {
    try{
      setLoading(true);
      await deleteItems(id);
      dispatch({ type: 'REMOVE_FROM_CART', payload: id });
      notify.success("Bỏ sản phẩm khỏi giỏ hàng thành công", "Thông báo")
    } catch (e) {
      notify.error("Bỏ sản phẩm thất bại", "Thông báo")
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      await updateCart(itemId, quantity);
      const data = await getCart();
      dispatch({ type: 'LOAD_CART', payload: mapBackendCartToState(data) });
      notify.success("Cập nhập thành công", "Thông báo")
    } catch (e) {
      notify.error("Cập nhập thất bại", "Thông báo")
    } finally {
      setLoading(false);
    }
  };


  const applyDiscount = (code: string) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: code });
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await clearCartApi();
      dispatch({ type: 'CLEAR_CART' });
    } catch (e) {
      setError("Xóa giỏ hàng thất bại");
    } finally {
      setLoading(false);
    }
  };


  const getTotalItems = () => {
    return state.items.reduce((total:any, item:any) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return state.items.reduce((total:any, item:any) => total + (item.price * item.quantity), 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    return subtotal
  };

  return (
    <CartContext.Provider value={{
      state,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      applyDiscount,
      clearCart,
      getTotalItems,
      getSubtotal,
      getTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};