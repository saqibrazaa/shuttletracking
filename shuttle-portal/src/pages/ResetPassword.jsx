import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.msg || 'Reset failed');
      }
    } catch (err) {
      setError('Server connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[100px]"></div>
      </div>

      <div className="glass-card w-full max-w-md p-10 rounded-3xl shadow-2xl relative z-10 border border-white/5 animate-in fade-in zoom-in-95 duration-500">
        <header className="mb-10 text-center">
            <h2 className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">Security Protocol</h2>
            <p className="text-on-surface-variant text-sm mt-3 font-medium">Please enter your new access credentials.</p>
        </header>

        {error && (
            <div className="mb-6 p-4 bg-error-container/20 border border-error/20 text-error text-xs font-bold rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
            </div>
        )}

        {success ? (
            <div className="text-center py-10 animate-in fade-in">
                <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-secondary text-4xl">check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Password Updated</h3>
                <p className="text-on-surface-variant">Redirecting to command center...</p>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">New Password</label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>lock</span>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••" 
                            className="w-full bg-surface-container-low border border-white/5 rounded-xl py-4 pl-12 pr-12 text-on-surface focus:ring-2 focus:ring-primary/30 transition-all outline-none" 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="material-symbols-outlined absolute right-4 text-outline cursor-pointer hover:text-on-surface transition-colors select-none" 
                        >
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-primary uppercase tracking-[0.2em] ml-1">Confirm Identity</label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>verified_user</span>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••" 
                            className="w-full bg-surface-container-low border border-white/5 rounded-xl py-4 pl-12 pr-12 text-on-surface focus:ring-2 focus:ring-primary/30 transition-all outline-none" 
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold font-headline shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Finalize Update'}
                </button>
            </form>
        )}
      </div>
    </div>
  );
}
