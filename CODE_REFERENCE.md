# Login System - Code Reference

## Complete Code Snippets

---

## 1. Login.tsx (New Component)

**Full file:** `components/Login.tsx` (123 lines)

```typescript
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { username?: string; password?: string } = {};

    // Validation
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-xl shadow-lg border border-blue-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-100 rounded-lg mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m0 0h6m0-6h-6m0 0h-6"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Chemical Equipment</h1>
          <p className="text-slate-500 text-sm mt-1">Parameter Visualizer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (errors.username) setErrors({ ...errors, username: undefined });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                errors.username ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                errors.password ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-6 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Demo credentials • No real authentication required
        </p>
      </div>
    </div>
  );
};
```

---

## 2. ProtectedRoute.tsx (New Component)

**Full file:** `components/ProtectedRoute.tsx` (16 lines)

```typescript
import React from 'react';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  children,
  fallback,
}) => {
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
};
```

---

## 3. App.tsx Changes (Partial - Key Sections)

**New imports:**
```typescript
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
```

**New state:**
```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

**Check login on mount:**
```typescript
useEffect(() => {
  const savedCredentials = localStorage.getItem('auth_credentials');
  if (savedCredentials) {
    setIsAuthenticated(true);
  }
}, []);
```

**Login handler:**
```typescript
const handleLogin = (username: string, password: string) => {
  localStorage.setItem('auth_credentials', JSON.stringify({ username, password }));
  setIsAuthenticated(true);
};
```

**Logout handler:**
```typescript
const handleLogout = () => {
  localStorage.removeItem('auth_credentials');
  setIsAuthenticated(false);
  setActiveTab('dashboard');
};
```

**Conditional render:**
```typescript
// If not authenticated, show login page
if (!isAuthenticated) {
  return <Login onLogin={handleLogin} />;
}

// Otherwise show dashboard
return (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar 
      isLive={isLive} 
      isDemo={isDemo}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}  // ← New prop
    />
    {/* ... rest of dashboard ... */}
  </div>
);
```

---

## 4. Navbar.tsx Changes (Partial)

**Updated interface:**
```typescript
interface NavbarProps {
  isLive?: boolean;
  isDemo?: boolean;
  activeTab: string;
  onTabChange: (tab: any) => void;
  onLogout?: () => void;  // ← New prop
}
```

**Updated component signature:**
```typescript
export const Navbar: React.FC<NavbarProps> = ({ 
  isLive, 
  isDemo, 
  activeTab, 
  onTabChange, 
  onLogout  // ← New parameter
}) => {
```

**Logout button (added to navbar):**
```typescript
{onLogout && (
  <button
    onClick={onLogout}
    className="ml-2 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors hover:bg-slate-800 rounded-lg"
    title="Sign out"
  >
    <i className="fas fa-sign-out-alt mr-1"></i>
    <span className="hidden sm:inline">Logout</span>
  </button>
)}
```

---

## How It All Fits Together

```
App.tsx (Main)
├── Check localStorage on mount
├── If logged in: Show Dashboard
│   ├── <Navbar onLogout={handleLogout} />
│   ├── <main> with tabs and content
│   └── [User clicks Logout] → Clear localStorage → Back to login
│
└── If not logged in: Show <Login onLogin={handleLogin} />
    └── [User submits] → Store credentials → Set isAuthenticated=true
```

---

## Key Points

1. **No backend required** - Demo mode accepts any credentials
2. **Persistent** - Refresh page = stays logged in
3. **Type-safe** - Full TypeScript interfaces
4. **Professional UI** - Tailwind CSS styling
5. **Simple validation** - Only required fields checked
6. **Easy to extend** - Add backend validation later without changing structure

---

## What's NOT Implemented (Intentionally)

- ❌ Password hashing
- ❌ User database
- ❌ Session tokens
- ❌ JWT/OAuth
- ❌ "Forgot password"
- ❌ User registration
- ❌ Rate limiting
- ❌ Two-factor auth

All of these can be added to the backend later without changing this frontend login UI.

---
