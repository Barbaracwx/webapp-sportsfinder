'use client';

import { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/types';
import { useRouter } from 'next/navigation';

interface User {
  telegramId: string;
  firstName: string;
  displayName: string; // Add displayName to the User interface
  gender: string;
  age: number;
  points: number;
  location: string[];
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
  const [notification, setNotification] = useState<{ message: string; type: 'validation' | 'success' } | null>(null); // For notifications
  const [sports, setSports] = useState<{ [key: string]: string }>({});
  const [gender, setGender] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>(''); // New state for displayName

  const router = useRouter(); // Initialize the router

  /* to add in user if not in the database yet */
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
              setUser(data);
              setDisplayName(data.displayName || ''); // Set displayName from the database
              setGender(data.gender);
              setSports(data.sports || {});
              // Ensure age is set from the database
              setUser((prevUser) => (prevUser ? { ...prevUser, age: data.age || 18 } : null));
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

  /*to save profile data in database*/
  const handleSaveProfile = async () => {
    if (!user) return;

    // Validate displayName, gender, location, and sports
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
      const currentAge = user.age; // Capture the current age
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: user.telegramId,
          displayName: displayName.trim(), // Include displayName in the payload
          gender: user.gender,
          age: currentAge, // Use the captured age
          sports: sports, // Send the sports data
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

  /*update skill level*/
  const handleSkillLevelChange = (sport: string, level: string) => {
    setSports((prev) => ({ ...prev, [sport]: level }));
  };

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4 text-black min-h-screen relative" style={{ backgroundColor: '#d9f8e1' }}>
      <h2 className="text-2xl font-bold mb-4">User Bio</h2>

      {/* Display Name Input */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your display name?</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur(); // Close the keyboard
            }
          }}
          placeholder="Enter your display name"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Age Slider */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your age?</label>
        <input
          type="range"
          min="18"
          max="85"
          value={user.age || 18} // Default to 18 if age is not set
          onChange={(e) => setUser({ ...user, age: Number(e.target.value) })} // Convert to number
          className="w-full cursor-pointer"
        />
        <p className="mt-2 text-center text-lg font-semibold">{user.age || 18} years old</p>
      </div>

      {/* Gender Selection */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What is your gender?</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="Male"
              checked={user.gender === 'Male'}
              onChange={(e) => {
                setUser({ ...user, gender: e.target.value });
                setGender(e.target.value); // ✅ Correctly updates gender state
              }}
              className="mr-2"
            />
            Male
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="gender"
              value="Female"
              checked={user.gender === 'Female'}
              onChange={(e) => {
                setUser({ ...user, gender: e.target.value });
                setGender(e.target.value); // ✅ Correctly updates gender state
              }}
              className="mr-2"
            />
            Female
          </label>
        </div>
      </div>

      {/* Sports Selection */}
      <div className="mt-6">
        <label className="block text-lg font-medium mb-2">What sports do you play?</label>
        {['Tennis', 'Badminton', 'Table Tennis', 'Pickleball'].map((sport) => (
          <div key={sport} className="flex items-center gap-4 mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!sports[sport]}
                onChange={(e) => handleSportChange(sport, e.target.checked)}
                className="mr-2"
              />
              {sport}
            </label>
            {sports[sport] && (
              <select
                value={sports[sport]}
                onChange={(e) => handleSkillLevelChange(sport, e.target.value)}
                className="p-1 border rounded"
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

      {/* Save profile Button */}
      <button
        onClick={handleSaveProfile}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 block mx-auto"
      >
        Save Profile
      </button>

      {/* Notification Overlay */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="text-lg font-semibold">{notification.message}</p>
            {notification.type === 'validation' && (
              <button
                onClick={() => setNotification(null)} // Close the notification
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