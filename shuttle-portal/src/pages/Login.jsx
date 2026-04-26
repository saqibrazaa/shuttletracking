import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config';
import Cropper from 'react-easy-crop';

import { getCroppedImg } from '../utils/cropImage';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      fatherName: '',
      department: '',
      semester: '',
      rollNumber: '',
      dob: '',
      phoneNumber: '',
      cnic: '',
      vehicleNumber: '',
      employeeId: ''
  });
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  
  // Forgot Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Cropper states
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const formatCNIC = (value) => {
    const numbers = value.replace(/\D/g, '');
    let formatted = '';
    if (numbers.length > 0) {
      formatted += numbers.substring(0, 5);
      if (numbers.length > 5) {
        formatted += '-' + numbers.substring(5, 12);
        if (numbers.length > 12) {
          formatted += '-' + numbers.substring(12, 13);
        }
      }
    }
    return formatted;
  };

  const handleInputChange = (e) => {
      let { name, value } = e.target;
      if (name === 'cnic') {
          value = formatCNIC(value);
      }
      setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const generateCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setProfileImage(croppedImage);
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = () => {
      setIsRegister(!isRegister);
      setError('');
      setProfileImage(null);
      if (!isRegister && role === 'admin') {
          setRole('student');
      }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEmailSent(true);
      } else {
        setError(data.msg || 'Failed to send reset link');
      }
    } catch (err) {
      setError('Server connection failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    let result;
    if (isRegister) {
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        data.append('role', role);
        if (profileImage) {
            data.append('profilePicture', profileImage);
        }
        result = await register(data);
    } else {
        result = await login(formData.email, formData.password);
    }

    if (result.success) {
        const userRole = result.user?.role || role;
        if (userRole === 'student') navigate('/student/dashboard');
        else if (userRole === 'driver') navigate('/driver/dashboard');
        else navigate('/admin/dashboard');
    } else {
        setError(result.msg || 'An error occurred');
    }
  };

  return (
    <>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-primary/10 blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full bg-secondary/5 blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vw] rotate-12 bg-tertiary/5 blur-[150px]"></div>
      </div>

      <main className="relative z-10 w-full max-w-[1200px] px-6 py-12 flex flex-col items-center mx-auto">
        <div className="mb-12 text-center text-on-surface">
            <h1 className="text-3xl font-headline font-extrabold tracking-tighter bg-gradient-to-br from-[#b4c5ff] to-[#2563eb] bg-clip-text text-transparent">
                Shuttle Tracking
            </h1>
            <p className="text-on-surface-variant text-sm tracking-wide mt-2 font-medium">Smart Shuttle Ecosystem</p>
        </div>

        <div className={`glass-card w-full ${isRegister && role === 'student' ? 'max-w-2xl' : 'max-w-md'} rounded-lg p-8 md:p-10 shadow-2xl shadow-blue-900/20 transition-all duration-500`}>
            <header className="mb-10 text-left">
                <h2 className="text-2xl md:text-3xl font-headline font-bold text-on-surface mb-2">
                    {isForgotPassword ? 'Reset Access' : (isRegister ? 'Create Account' : 'Welcome Back')}
                </h2>
                <p className="text-on-surface-variant text-sm">
                    {isForgotPassword 
                        ? 'Enter your email to receive a secure reset protocol.' 
                        : (isRegister ? 'Join our elite transit network today.' : 'Please enter your credentials to access the hub.')}
                </p>
            </header>

            {error && (
                <div className="mb-6 p-4 bg-error-container/20 border border-error/20 text-error text-xs font-bold rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {error}
                </div>
            )}

            {isForgotPassword ? (
                <div className="space-y-6">
                    {isEmailSent ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-secondary text-2xl">mail</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Transmission Successful</h3>
                            <p className="text-sm text-on-surface-variant mb-6">A secure reset protocol has been dispatched to {forgotEmail}.</p>
                            <button 
                                onClick={() => {
                                    setIsForgotPassword(false);
                                    setIsEmailSent(false);
                                }}
                                className="text-primary text-xs font-bold hover:underline"
                            >
                                Back to Log In Hub
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Registered Email</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>mail</span>
                                    <input 
                                        type="email" 
                                        required 
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="yourname@shuttle.com" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="w-full py-4 rounded-xl font-headline font-bold text-on-primary bg-primary shadow-lg active:scale-95 transition-all"
                            >
                                Send Reset Link
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsForgotPassword(false)}
                                className="w-full text-on-surface-variant text-xs font-bold hover:text-white transition-colors"
                            >
                                Cancel Request
                            </button>
                        </form>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3 font-body">
                    <span className="text-xs font-label font-semibold tracking-widest text-primary uppercase ml-1">Access Level</span>
                    <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1.5 rounded-lg">
                        <button 
                            type="button" 
                            onClick={() => setRole('student')}
                            className={`py-2 text-xs font-label font-bold rounded-md transition-all duration-300 ${role === 'student' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                            Student
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setRole('driver')}
                            className={`py-2 text-xs font-label font-bold rounded-md transition-all duration-300 ${role === 'driver' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                            Driver
                        </button>
                        {!isRegister && (
                            <button 
                                type="button" 
                                onClick={() => setRole('admin')}
                                className={`py-2 text-xs font-label font-bold rounded-md transition-all duration-300 ${role === 'admin' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                                Admin
                            </button>
                        )}
                    </div>
                </div>

                <div className={`grid grid-cols-1 ${isRegister && role === 'student' ? 'md:grid-cols-2' : ''} gap-x-6 gap-y-6`}>
                    {isRegister && (
                        <div className={`${role === 'student' ? 'md:col-span-2' : ''} flex flex-col items-center mb-4`}>
                            <div className="relative w-24 h-24 rounded-full bg-surface-container-low border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden group hover:border-primary transition-all">
                                {profileImage ? (
                                    <img src={URL.createObjectURL(profileImage)} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-outline/40">add_a_photo</span>
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <span className="text-[10px] font-label font-bold text-outline mt-2 uppercase tracking-widest">Upload Profile Picture</span>
                        </div>
                    )}
                    {isRegister && (
                        <div className="relative group font-body">
                            <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Full Name</label>
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>person</span>
                                <input 
                                    type="text" 
                                    name="name"
                                    required 
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Saqib Raza" 
                                    className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                />
                            </div>
                        </div>
                    )}

                    {isRegister && role === 'student' && (
                        <>
                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Father's Name</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>family_history</span>
                                    <input 
                                        type="text" 
                                        name="fatherName"
                                        required 
                                        value={formData.fatherName}
                                        onChange={handleInputChange}
                                        placeholder="Mushtaque Ahmed" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Department</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>apartment</span>
                                    <input 
                                        type="text" 
                                        name="department"
                                        required 
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        placeholder="Computer Science" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Semester</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>school</span>
                                    <input 
                                        type="text" 
                                        name="semester"
                                        required 
                                        value={formData.semester}
                                        onChange={handleInputChange}
                                        placeholder="6th" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Roll Number</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>pin</span>
                                    <input 
                                        type="text" 
                                        name="rollNumber"
                                        required 
                                        value={formData.rollNumber}
                                        onChange={handleInputChange}
                                        placeholder="CS-2021-045" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Date of Birth</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>calendar_today</span>
                                    <input 
                                        type="date" 
                                        name="dob"
                                        required 
                                        value={formData.dob}
                                        onChange={handleInputChange}
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>

                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Phone Number</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>call</span>
                                    <input 
                                        type="tel" 
                                        name="phoneNumber"
                                        required 
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        placeholder="+1 234 567 890" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {isRegister && role === 'driver' && (
                        <>
                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Father's Name</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>family_history</span>
                                    <input 
                                        type="text" 
                                        name="fatherName"
                                        required 
                                        value={formData.fatherName}
                                        onChange={handleInputChange}
                                        placeholder="Mushtaque Ahmed" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>
                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">CNIC Number</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>badge</span>
                                    <input 
                                        type="text" 
                                        name="cnic"
                                        required 
                                        value={formData.cnic}
                                        onChange={handleInputChange}
                                        placeholder="41303-8373069-9" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none font-mono" 
                                    />
                                </div>
                            </div>
                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Vehicle Registration #</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>directions_bus</span>
                                    <input 
                                        type="text" 
                                        name="vehicleNumber"
                                        required 
                                        value={formData.vehicleNumber}
                                        onChange={handleInputChange}
                                        placeholder="ABC-1234" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>
                            <div className="relative group font-body">
                                <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Employee ID</label>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>id_card</span>
                                    <input 
                                        type="text" 
                                        name="employeeId"
                                        required 
                                        value={formData.employeeId}
                                        onChange={handleInputChange}
                                        placeholder="DRV-2024-001" 
                                        className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="relative group font-body">
                        <label className="block text-xs font-label font-semibold text-on-surface-variant mb-2 ml-1">Email Address</label>
                        <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>mail</span>
                            <input 
                                type="email" 
                                name="email"
                                required 
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="name@university.edu" 
                                className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                            />
                        </div>
                    </div>
                </div>

                <div className="relative group font-body">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <label className="text-xs font-label font-semibold text-on-surface-variant">Password</label>
                        {!isRegister && (
                            <button 
                                type="button"
                                onClick={() => setIsForgotPassword(true)}
                                className="text-[10px] font-label font-bold text-primary hover:underline uppercase tracking-tighter"
                            >
                                Forgot?
                            </button>
                        )}
                    </div>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-outline" style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}>lock</span>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            name="password"
                            required 
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="••••••••" 
                            className="w-full bg-surface-container-low border-none rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-high transition-all outline-none" 
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="material-symbols-outlined absolute right-4 text-outline cursor-pointer hover:text-on-surface transition-colors select-none" 
                            style={{fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"}}
                        >
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </button>
                    </div>
                </div>

        <button type="submit" className="w-full py-4 rounded-xl font-headline font-bold text-on-primary bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary-container/20 active:scale-[0.96] transition-transform duration-300">
            {isRegister ? 'Register!' : 'Enter Dashboard'}
        </button>

        {/* Image Cropper Modal */}
        {imageToCrop && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                <div className="bg-surface-container-low w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] border border-white/5">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-low">
                        <h3 className="text-white font-bold tracking-tight">Crop Profile Image</h3>
                        <button onClick={() => setImageToCrop(null)} className="text-on-surface-variant hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                    
                    <div className="relative flex-grow bg-black/20">
                        <Cropper
                            image={imageToCrop}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    <div className="p-6 bg-surface-container-low space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                <span>Adjust Scale</span>
                                <span>{Math.round(zoom * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={generateCroppedImage}
                                className="flex-grow bg-primary text-on-primary py-3.5 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all"
                            >
                                Use Cropped Image
                            </button>
                            <button 
                                onClick={() => setImageToCrop(null)}
                                className="px-6 py-3.5 rounded-xl bg-surface-container-high text-on-surface font-bold hover:bg-surface-bright transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
            </form>
        )}

            <footer className="mt-10 text-center">
                <p className="text-on-surface-variant text-xs">
                    {isRegister ? 'Already have an account?' : 'New to the fleet?'} 
                    <button 
                        onClick={handleToggle}
                        className="text-secondary font-bold hover:underline underline-offset-4 ml-1"
                    >
                        {isRegister ? 'Sign In' : 'Register'}
                    </button>
                </p>
            </footer>
        </div>

        <div className="mt-16 w-full max-w-4xl opacity-40">
            <div className="relative h-24 overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                <div className="flex justify-between items-center px-12 h-full">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-label font-bold text-outline tracking-widest uppercase">System Status</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                            <span className="text-sm font-headline font-bold text-on-surface">148 Active Shuttles</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </>
  );
}
