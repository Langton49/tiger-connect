import { createContext, useContext, useState, ReactNode } from "react";
import { MarketplaceItem } from "@/models/Marketplace";

interface CartItem {
  item: MarketplaceItem;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: MarketplaceItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: MarketplaceItem, quantity: number) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) => cartItem.item.id === item.id
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.item.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + quantity,
              }
            : cartItem
        );
      }

      return [...currentItems, { item, quantity }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((cartItem) => cartItem.item.id !== itemId)
    );
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((cartItem) =>
        cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce(
    (total, cartItem) => total + cartItem.quantity,
    0
  );

  const totalPrice = items.reduce(
    (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
