import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);

    if (result.success) {
      // Role-based redirection
      const roleRedirects = {
        PSP: '/psp/dashboard',
        CRO: '/admin/cro',
        CFO: '/admin/cfo',
      };
      let redirectTo = location.state?.from?.pathname;

      if (!redirectTo) {
        if (result.user.role === 'PSP' && (result.user.creditLineStatus === 'NeedMoreInfo' || result.user.isExpired)) {
          redirectTo = '/psp/onboarding';
        } else {
          redirectTo = roleRedirects[result.user.role] || '/';
        }
      }

      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <CreditCard className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold mb-4">CredMate</h1>
          <p className="text-xl text-white/80 mb-8">
            DeFi-Powered Credit Lines for Payment Service Providers
          </p>
          <div className="space-y-4 text-left bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
              <span>Instant credit decisions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
              <span>On-chain transparency</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
              <span>Revolving credit facility</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <CreditCard className="w-10 h-10 text-brand-purple" />
            <span className="text-2xl font-bold text-gradient">CredMate</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Sign in to access your dashboard</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-brand-purple hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-brand w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600 mb-4">Demo Accounts</p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">PSP:</span>
                  <code className="text-brand-purple">psp@credmate.com</code>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">CRO:</span>
                  <code className="text-brand-purple">cro@credmate.com</code>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">CFO:</span>
                  <code className="text-brand-purple">cfo@credmate.com</code>
                </div>
                <p className="text-center text-gray-500 text-xs mt-2">Password: demo123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <a href="/register" className="text-brand-purple hover:underline font-medium">
              Apply for Liquidation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
