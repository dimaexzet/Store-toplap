import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'

export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  stock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  isItemInCart: (id: string) => boolean
  cartTotalPrice: () => number
  cartTotalItems: () => number
}

const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (data) => {
        const currentItems = get().items
        const existingItem = currentItems.find((item) => item.id === data.id)
        
        if (existingItem) {
          const newQuantity = Math.min(existingItem.quantity + 1, data.stock)
          
          if (newQuantity === existingItem.quantity) {
            toast.warning(`Maximum available quantity (${data.stock}) reached`)
            return
          }
          
          set({
            items: currentItems.map((item) => 
              item.id === data.id 
                ? { ...item, quantity: newQuantity }
                : item
            )
          })
          
          toast.success(`Updated ${data.name} quantity (${newQuantity})`)
        } else {
          set({ items: [...currentItems, { ...data, quantity: 1 }] })
          toast.success(`Added ${data.name} to cart`)
        }
      },
      
      removeItem: (id) => {
        const currentItems = get().items
        const itemToRemove = currentItems.find(item => item.id === id)
        
        set({ items: currentItems.filter((item) => item.id !== id) })
        
        if (itemToRemove) {
          toast.info(`Removed ${itemToRemove.name} from cart`)
        }
      },
      
      updateQuantity: (id, quantity) => {
        const currentItems = get().items
        const itemToUpdate = currentItems.find(item => item.id === id)
        
        if (!itemToUpdate) return
        
        const safeQuantity = Math.max(1, Math.min(quantity, itemToUpdate.stock))
        
        if (safeQuantity !== quantity) {
          toast.warning(`Quantity adjusted to ${safeQuantity} based on available stock`)
        }
        
        set({
          items: currentItems.map((item) => 
            item.id === id ? { ...item, quantity: safeQuantity } : item
          )
        })
      },
      
      clearCart: () => {
        set({ items: [] })
        toast.success('Cart cleared')
      },
      
      isItemInCart: (id) => {
        return get().items.some((item) => item.id === id)
      },
      
      cartTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (item.price * item.quantity)
        }, 0)
      },
      
      cartTotalItems: () => {
        return get().items.reduce((total, item) => {
          return total + item.quantity
        }, 0)
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export default useCart 