'use client';

import { WebApp } from '@twa-dev/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';


interface User {
  telegramId: string;
  firstName: string;
  displayName: string;
  gender: string;
  age: number;
  points: number;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'validation' | 'success' } | null>(null);
  const [sports, setSports] = useState<{ [key: string]: string }>({});
  const [gender, setGender] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true)
  const [sliderProgress, setSliderProgress] = useState("32.835%")
  const sliderRef = useRef<HTMLInputElement>(null)


  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();

      const initData = tg.initData || '';
      const initDataUnsafe = tg.initDataUnsafe || {};

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(initDataUnsafe.user),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error);
            } else {
              const initialAge = data.age || 40;
              setUser({
                ...data,
                age: initialAge
              });
              setDisplayName(data.displayName || '');
              setGender(data.gender);
              setSports(data.sports || {});
              updateSliderProgress(initialAge); // Update slider position
            }
          })
          .catch((err) => {
            setError('Failed to fetch user data');
          });
      } else {
        setError('No user data available');
      }
    } else {
      setError('This app should be opened in Telegram');
    }
  }, []);

    // Function to update the slider progress CSS variable
    const updateSliderProgress = (age: number) => {
      const min = 18
      const max = 85
      const percentage = ((age - min) / (max - min)) * 100
      const progressValue = `${percentage}%`
  
      setSliderProgress(progressValue)
    }

    // Update your handleAgeChange function to ensure proper slider positioning
    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newAge = Number(e.target.value);
      setUser((prevUser) => (prevUser ? { ...prevUser, age: newAge } : null));
      updateSliderProgress(newAge);
      
      // Force a re-render to ensure thumb position updates
      if (sliderRef.current) {
        sliderRef.current.value = newAge.toString();
      }
    };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      setNotification({ message: 'Please enter your display name.', type: 'validation' });
      return;
    }
    if (!user.gender) {
      setNotification({ message: 'Please select your gender.', type: 'validation' });
      return;
    }
    if (Object.keys(sports).length === 0) {
      setNotification({ message: 'Please select at least one sport.', type: 'validation' });
      return;
    }

    try {
      const currentAge = user.age;
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: user.telegramId,
          displayName: displayName.trim(),
          gender: user.gender,
          age: currentAge,
          sports: sports,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setUser({ ...user, displayName: displayName.trim(), gender: data.gender, age: data.age });
        setNotification({ message: 'Profile saved successfully!', type: 'success' });        
        setTimeout(() => setNotification(null), 3000);

        // Navigate to /about/match-preferences after saving
        router.push('/about/match-preferences');
      } else {
        setError('Failed to save profile');
      }
    } catch (err) {
      setError('An error occurred while saving profile');
    }
  };

  /*update sports choices*/
  const handleSportChange = (sport: string, selected: boolean) => {
    if (selected) {
      setSports((prev) => ({ ...prev, [sport]: 'Newbie' }));
    } else {
      setSports((prev) => {
        const newSports = { ...prev };
        delete newSports[sport];
        return newSports;
      });
    }
  };

  const handleSkillLevelChange = (sport: string, level: string) => {
    setSports((prev) => ({ ...prev, [sport]: level }));
  };

    // Update slider progress when component mounts
    useEffect(() => {
      if (user && user.age) {
        updateSliderProgress(user.age)
      }
    }, [])

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4 text-black min-h-screen relative" style={{ backgroundColor: '#F0F9F0' }}>
      <h1 className="text-2xl font-bold mb-4 text-center">User Bio</h1>

      {/* Display Name Input */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your display name?</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          placeholder="Enter your display name"
          className="mt-1 block w-full rounded-lg border-2 border-[#98b73d] p-3 focus:border-[#bada55] focus:ring focus:ring-[#bada55] focus:ring-opacity-50 bg-[#f0f9f0]"
        />
      </div>

      {/* Age Slider */}
      {/* Age Slider - Fixed Custom Version */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your age?</label>
        <div className="relative py-4">
          {/* Track container */}
          <div className="relative w-full h-2 bg-[#E5E7EB] rounded-full">
            {/* Progress bar */}
            <div
              className="absolute top-0 left-0 h-full bg-[#B3D250] rounded-l-full"
              style={{ width: sliderProgress }}
            ></div>
          </div>
          
          {/* Actual input (now properly sized and positioned) */}
          <input
            ref={sliderRef}
            type="range"
            min="18"
            max="85"
            value={user.age || 18}
            onChange={handleAgeChange}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            style={{
              // Make sure it's tall enough for touch interactions
              height: '40px', // Increased height for better touch area
              top: '50%',
              transform: 'translateY(-50%)'
            }}
          />
          
          {/* Custom thumb - now purely visual */}
          <div
            className="absolute top-1/2 w-5 h-5 bg-[#B3D250] rounded-full border-2 border-white shadow-md transform -translate-y-1/2 pointer-events-none"
            style={{
              left: sliderProgress,
              marginLeft: "-10px",
            }}
          ></div>
        </div>
        <p className="mt-2 text-center text-lg font-semibold">{user.age || 18} years old</p>
      </div>


      {/* Gender Selection */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your gender?</label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => {
              setUser({ ...user, gender: 'Male' });
              setGender('Male');
            }}
            className={`w-1/2 p-4 rounded-full ${user.gender === 'Male' ? 'bg-[#B3D250]' : 'bg-[#E8F4BE]'} focus:outline-none`}
          >
            Male
          </button>

          <button
            type="button"
            onClick={() => {
              setUser({ ...user, gender: 'Female' });
              setGender('Female');
            }}
            className={`w-1/2 p-3 rounded-full ${user.gender === 'Female' ? 'bg-[#B3D250]' : 'bg-[#E8F4BE]'} focus:outline-none`}
          >
            Female
          </button>
        </div>
      </div>

      {/* Sports Selection */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-4">What sports do you play?</label>
        <div className="space-y-4">
          {['Tennis', 'Badminton', 'Table Tennis', 'Pickleball', 'Padel', 'Squash'].map((sport) => (
            <div key={sport} className="flex items-center gap-4">
              {/* Sport Button */}
              <button
                type="button"
                onClick={() => handleSportChange(sport, !sports[sport])}
                className={`w-1/2 p-3 rounded-full ${sports[sport] ? 'bg-[#B3D250]' : 'bg-[#E8F4BE]'} focus:outline-none text-center`}
              >
                {sport}
              </button>
              
              {/* Skill Level Dropdown (only shown if sport is selected) */}
              {sports[sport] && (
                <select
                  value={sports[sport]}
                  onChange={(e) => handleSkillLevelChange(sport, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="Newbie">Newbie</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Pro">Pro</option>
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save profile Button */}
      <div className="mt-8 flex justify-center">
      <button
        onClick={handleSaveProfile}
        className="w-1/2 py-4 px-6 rounded-full bg-[#B3D250] hover:bg-[#B3D250] active:bg-[#98b73d] text-black font-bold text-lg transition-colors duration-200"
      >
        Save!
      </button>
      </div>

      {/* Copyright Footer */}
      <div className="text-center mt-8 mb-4 text-gray-600 text-sm">
        <p>&copy; 2025 SportsFinder</p>
      </div>

      {/* Notification Overlay */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">{notification.message}</p>
            {notification.type === 'validation' && (
              <button
                onClick={() => setNotification(null)}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Got it!
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}