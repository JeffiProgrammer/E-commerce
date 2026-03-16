import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  User as UserIcon, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Apple, 
  LeafyGreen, 
  Milk, 
  Cookie, 
  Drumstick, 
  ChevronDown,
  Star,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { Category, Product, CartItem, Review } from './types';
import { motion, AnimatePresence } from 'motion/react';
import './i18n';

const CategoryIcon = ({ name, size = 20 }: { name: string, size?: number }) => {
  switch (name) {
    case 'Apple': return <Apple size={size} />;
    case 'LeafyGreen': return <LeafyGreen size={size} />;
    case 'Milk': return <Milk size={size} />;
    case 'Cookie': return <Cookie size={size} />;
    case 'Drumstick': return <Drumstick size={size} />;
    default: return <LayoutGrid size={size} />;
  }
};

export default function App() {
  const { t, i18n } = useTranslation();
  const { user, logout, isAdmin, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<'home' | 'cart' | 'admin' | 'login' | 'register' | 'product_details'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isRTL = i18n.language === 'fa';

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const fetchProducts = async () => {
    const url = selectedCategory ? `/api/products?categoryId=${selectedCategory}` : '/api/products';
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data);
  };

  const fetchCart = async () => {
    const res = await fetch('/api/cart', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setCartItems(data.items || []);
  };

  const addToCart = async (productId: number) => {
    if (!token) {
      setView('login');
      return;
    }
    await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    fetchCart();
  };

  const updateCartQuantity = async (itemId: number, quantity: number) => {
    await fetch(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ quantity })
    });
    fetchCart();
  };

  const removeFromCart = async (itemId: number) => {
    await fetch(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchCart();
  };

  const getLocalized = (obj: any, field: string) => {
    return obj[`${field}_${i18n.language}`] || obj[`${field}_en`];
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setView('product_details');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isRTL ? 'rtl font-vazir' : 'ltr font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 
                className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent cursor-pointer"
                onClick={() => setView('home')}
              >
                {t('app_name')}
              </h1>
              <div className="hidden md:flex items-center gap-4">
                <button onClick={() => setView('home')} className={`px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${view === 'home' ? 'text-emerald-600 font-semibold' : ''}`}>
                  {t('home')}
                </button>
                {isAdmin && (
                  <button onClick={() => setView('admin')} className={`px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${view === 'admin' ? 'text-emerald-600 font-semibold' : ''}`}>
                    {t('admin')}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setView('cart')} 
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative"
              >
                <ShoppingCart size={20} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>

              <div className="hidden md:flex items-center gap-4">
                {/* Language Switcher */}
                <div className="relative group">
                  <select 
                    value={i18n.language} 
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className={`appearance-none bg-zinc-100 dark:bg-zinc-800 border-none text-[11px] font-bold py-1.5 rounded-lg focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all uppercase ${isRTL ? 'pl-6 pr-2' : 'pr-6 pl-2'}`}
                  >
                    <option value="en">EN</option>
                    <option value="de">DE</option>
                    <option value="fa">فا</option>
                  </select>
                  <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${isRTL ? 'left-1.5' : 'right-1.5'}`}>
                    <ChevronDown size={12} className="text-zinc-500 dark:text-zinc-300" />
                  </div>
                </div>

                <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                    <button onClick={logout} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setView('login')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium">
                    <UserIcon size={18} />
                    <span className="hidden sm:inline">{t('login')}</span>
                  </button>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-6">
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { setView('home'); setIsMobileMenuOpen(false); }} 
                    className={`text-left px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${view === 'home' ? 'bg-emerald-50 text-emerald-600 font-bold' : ''}`}
                  >
                    {t('home')}
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }} 
                      className={`text-left px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${view === 'admin' ? 'bg-emerald-50 text-emerald-600 font-bold' : ''}`}
                    >
                      {t('admin')}
                    </button>
                  )}
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

                <div className="flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-zinc-500">{t('language')}</span>
                  <div className="relative">
                    <select 
                      value={i18n.language} 
                      onChange={(e) => i18n.changeLanguage(e.target.value)}
                      className={`appearance-none bg-zinc-100 dark:bg-zinc-800 border-none text-[11px] font-bold py-1.5 rounded-lg focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all uppercase ${isRTL ? 'pl-6 pr-2' : 'pr-6 pl-2'}`}
                    >
                      <option value="en">EN</option>
                      <option value="de">DE</option>
                      <option value="fa">فا</option>
                    </select>
                    <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${isRTL ? 'left-1.5' : 'right-1.5'}`}>
                      <ChevronDown size={12} className="text-zinc-500 dark:text-zinc-300" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-zinc-500">{t('theme')}</span>
                  <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  </button>
                </div>

                <div className="pt-2">
                  {user ? (
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{user.name}</p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                      <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                        <LogOut size={20} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setView('login'); setIsMobileMenuOpen(false); }} 
                      className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-colors font-bold shadow-lg shadow-emerald-500/20"
                    >
                      <UserIcon size={20} />
                      {t('login')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex flex-col md:flex-row gap-8 relative">
                {/* Sidebar Filters */}
                <motion.aside 
                  initial={false}
                  animate={{ width: isSidebarOpen ? (isRTL ? 256 : 256) : 64 }}
                  className="hidden md:block bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm h-fit sticky top-24"
                >
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    {isSidebarOpen && <h3 className="font-bold text-lg">{t('categories')}</h3>}
                    <button 
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mx-auto"
                    >
                      {isSidebarOpen ? (isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />) : (isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)}
                    </button>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selectedCategory === null ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      <LayoutGrid size={20} className="shrink-0" />
                      {isSidebarOpen && <span className="font-medium truncate">{t('all_categories')}</span>}
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selectedCategory === cat.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                      >
                        <div className="shrink-0">
                          <CategoryIcon name={cat.icon} />
                        </div>
                        {isSidebarOpen && <span className="font-medium truncate">{getLocalized(cat, 'name')}</span>}
                      </button>
                    ))}
                  </div>
                </motion.aside>

                {/* Mobile Categories (Horizontal Scroll) */}
                <div className="md:hidden flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === null ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}
                  >
                    {t('all_categories')}
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <CategoryIcon name={cat.icon} size={16} />
                      {getLocalized(cat, 'name')}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                      <div key={product.id} className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-shadow group">
                        <div className="aspect-[4/3] overflow-hidden relative cursor-pointer" onClick={() => openProductDetails(product)}>
                          <img 
                            src={product.image} 
                            alt={getLocalized(product, 'name')} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                            ${product.price}
                          </div>
                        </div>
                        <div className="p-6">
                          <h4 className="text-xl font-bold mb-2 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => openProductDetails(product)}>
                            {getLocalized(product, 'name')}
                          </h4>
                          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 line-clamp-2">
                            {getLocalized(product, 'description')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400">{t('stock')}: {product.stock}</span>
                            <button 
                              onClick={() => addToCart(product.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm font-bold"
                            >
                              {t('add_to_cart')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'product_details' && selectedProduct && (
            <ProductDetails 
              product={selectedProduct} 
              onBack={() => setView('home')} 
              onAddToCart={() => addToCart(selectedProduct.id)}
              getLocalized={getLocalized}
            />
          )}

          {view === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-8">{t('cart')}</h2>
              {cartItems.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-700">
                  <ShoppingCart size={48} className="mx-auto mb-4 text-zinc-300" />
                  <p className="text-zinc-500">{t('empty_cart')}</p>
                  <button onClick={() => setView('home')} className="mt-4 text-emerald-600 font-bold hover:underline">
                    {t('home')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl flex items-center gap-4 border border-zinc-200 dark:border-zinc-800">
                      <img src={item.image} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold">{getLocalized(item, 'name')}</h4>
                        <p className="text-emerald-600 font-bold">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                  <div className="mt-8 p-6 bg-emerald-600 text-white rounded-3xl flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">{t('total')}</p>
                      <p className="text-3xl font-bold">${cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</p>
                    </div>
                    <button className="px-8 py-3 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-colors">
                      {t('checkout')}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'login' && <LoginView setView={setView} />}
          {view === 'register' && <RegisterView setView={setView} />}
          {view === 'admin' && isAdmin && <AdminPanel categories={categories} fetchCategories={fetchCategories} fetchProducts={fetchProducts} products={products} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function LoginView({ setView }: { setView: (v: any) => void }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else {
      login(data.user, data.token);
      setView('home');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl"
    >
      <h2 className="text-3xl font-bold mb-6 text-center">{t('login')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('email')}</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('password')}</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
          {t('login')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        {t('no_account')} <button onClick={() => setView('register')} className="text-emerald-600 font-bold hover:underline">{t('register')}</button>
      </p>
    </motion.div>
  );
}

function RegisterView({ setView }: { setView: (v: any) => void }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else {
      login(data.user, data.token);
      setView('home');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl"
    >
      <h2 className="text-3xl font-bold mb-6 text-center">{t('register')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('name')}</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('email')}</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('password')}</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
          {t('register')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        {t('have_account')} <button onClick={() => setView('login')} className="text-emerald-600 font-bold hover:underline">{t('login')}</button>
      </p>
    </motion.div>
  );
}

function AdminPanel({ categories, fetchCategories, products, fetchProducts }: any) {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct.id ? 'PUT' : 'POST';
    const url = editingProduct.id ? `/api/products/${editingProduct.id}` : '/api/products';
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(editingProduct)
    });
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchProducts();
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCategory.id ? 'PUT' : 'POST';
    const url = editingCategory.id ? `/api/categories/${editingCategory.id}` : '/api/categories';
    await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(editingCategory)
    });
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchCategories();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t('admin_panel')}</h2>
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'products' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
          >
            {t('products')}
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'categories' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
          >
            {t('categories')}
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-6">
          <button 
            onClick={() => setEditingProduct({ name_en: '', name_de: '', name_fa: '', description_en: '', description_de: '', description_fa: '', price: 0, image: '', stock: 0, categoryId: categories[0]?.id })}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            {t('add_product')}
          </button>

          <div className="grid grid-cols-1 gap-4">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={p.image} className="w-12 h-12 object-cover rounded-lg" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold">{p.name_en} / {p.name_fa}</h4>
                    <p className="text-sm text-zinc-500">${p.price}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingProduct(p)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                    <Settings size={20} />
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <button 
            onClick={() => setEditingCategory({ name_en: '', name_de: '', name_fa: '', icon: 'LayoutGrid' })}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            {t('add_product')}
          </button>

          <div className="grid grid-cols-1 gap-4">
            {categories.map((c: any) => (
              <div key={c.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <CategoryIcon name={c.icon} />
                  </div>
                  <h4 className="font-bold">{c.name_en} / {c.name_fa}</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingCategory(c)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                    <Settings size={20} />
                  </button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">{editingProduct.id ? t('edit_product') : t('add_product')}</h3>
            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('name_en')}</label>
                    <input placeholder="Name (EN)" value={editingProduct.name_en} onChange={e => setEditingProduct({...editingProduct, name_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('name_de')}</label>
                    <input placeholder="Name (DE)" value={editingProduct.name_de} onChange={e => setEditingProduct({...editingProduct, name_de: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('name_fa')}</label>
                    <input placeholder="Name (FA)" value={editingProduct.name_fa} onChange={e => setEditingProduct({...editingProduct, name_fa: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('description_en')}</label>
                    <textarea placeholder="Desc (EN)" value={editingProduct.description_en} onChange={e => setEditingProduct({...editingProduct, description_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('description_de')}</label>
                    <textarea placeholder="Desc (DE)" value={editingProduct.description_de} onChange={e => setEditingProduct({...editingProduct, description_de: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('description_fa')}</label>
                    <textarea placeholder="Desc (FA)" value={editingProduct.description_fa} onChange={e => setEditingProduct({...editingProduct, description_fa: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('price')}</label>
                    <input type="number" step="0.01" placeholder={t('price')} value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t('stock')}</label>
                    <input type="number" placeholder={t('stock')} value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{t('image_url')}</label>
                  <input placeholder="Image URL" value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">{t('category')}</label>
                  <select value={editingProduct.categoryId} onChange={e => setEditingProduct({...editingProduct, categoryId: parseInt(e.target.value)})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent">
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-6 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">{t('cancel')}</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">{t('save')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6">{editingCategory.id ? t('edit') : t('add_product')}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-6">
              <div className="space-y-4">
                <input placeholder="Name (EN)" value={editingCategory.name_en} onChange={e => setEditingCategory({...editingCategory, name_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                <input placeholder="Name (DE)" value={editingCategory.name_de} onChange={e => setEditingCategory({...editingCategory, name_de: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
                <input placeholder="Name (FA)" value={editingCategory.name_fa} onChange={e => setEditingCategory({...editingCategory, name_fa: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent" required />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{t('choose_icon') || 'Choose Icon'}</label>
                <div className="grid grid-cols-6 gap-2">
                  {['Apple', 'LeafyGreen', 'Milk', 'Cookie', 'Drumstick', 'LayoutGrid'].map(iconName => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setEditingCategory({...editingCategory, icon: iconName})}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center ${editingCategory.icon === iconName ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    >
                      <CategoryIcon name={iconName} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setEditingCategory(null)} className="px-6 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">{t('cancel')}</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">{t('save')}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProductDetails({ product, onBack, onAddToCart, getLocalized }: { product: Product, onBack: () => void, onAddToCart: () => void, getLocalized: any }) {
  const { t, i18n } = useTranslation();
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [product.id]);

  const fetchReviews = async () => {
    const res = await fetch(`/api/products/${product.id}/reviews`);
    const data = await res.json();
    setReviews(data);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    await fetch(`/api/products/${product.id}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ rating: newRating, comment: newComment })
    });
    setNewComment('');
    setNewRating(5);
    fetchReviews();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-emerald-600 font-bold hover:underline group">
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        {t('back_to_home')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <img src={product.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">{getLocalized(product, 'name')}</h2>
            <div className="flex items-center gap-4">
              <p className="text-4xl font-bold text-emerald-600">${product.price}</p>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                {t('stock')}: {product.stock}
              </span>
            </div>
          </div>
          
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {getLocalized(product, 'description')}
          </p>

          <button 
            onClick={onAddToCart}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <ShoppingCart size={22} />
            {t('add_to_cart')}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <h3 className="text-2xl font-bold">{t('reviews')}</h3>
          <div className="flex items-center gap-2 text-yellow-400">
            <Star size={20} fill="currentColor" />
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
            </span>
            <span className="text-zinc-400 text-sm">({reviews.length})</span>
          </div>
        </div>
        
        {token ? (
          <form onSubmit={handleSubmitReview} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
            <h4 className="text-lg font-bold">{t('write_review')}</h4>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{t('rating')}</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setNewRating(star)}
                    className="transition-transform hover:scale-110 active:scale-90"
                  >
                    <Star 
                      size={32} 
                      fill={star <= newRating ? "currentColor" : "none"} 
                      className={star <= newRating ? 'text-yellow-400' : 'text-zinc-300 dark:text-zinc-700'} 
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">{t('comment')}</label>
              <textarea 
                placeholder={t('comment')} 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] transition-all"
                required
              />
            </div>
            <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
              {t('submit_review')}
            </button>
          </form>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-800/50 p-6 rounded-2xl text-center">
            <p className="text-zinc-500 italic">{t('login_to_review') || 'Please login to write a review'}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.length === 0 ? (
            <div className="md:col-span-2 text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-zinc-500">{t('no_reviews')}</p>
            </div>
          ) : (
            reviews.map(review => (
              <motion.div 
                key={review.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold">
                      {review.userName[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold block">{review.userName}</span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-zinc-200 dark:text-zinc-800"} />
                    ))}
                  </div>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{review.comment}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
