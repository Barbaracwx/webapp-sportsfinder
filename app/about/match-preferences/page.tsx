'use client';

import { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/types';

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

interface User {
  telegramId: string;
  firstName: string;
  gender: string;
  age: number;
  points: number;
  location: string[];
  sports: { [key: string]: string }; // Sports data
}

export default function MatchPreferencesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState('');
  const [ageRanges, setAgeRanges] = useState<{ [key: string]: [number, number] }>({}); // Store age ranges for each sport

  /* Fetch user data */
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

              // Initialize age ranges for each sport
              const initialAgeRanges: { [key: string]: [number, number] } = {};
              Object.keys(data.sports || {}).forEach((sport) => {
                initialAgeRanges[sport] = [18, 60]; // Default age range for each sport
              });
              setAgeRanges(initialAgeRanges);
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

  /* Handle age range change for a sport */
  const handleAgeRangeChange = (sport: string, min: number, max: number) => {
    setAgeRanges((prev) => ({
      ...prev,
      [sport]: [min, max],
    }));
  };

  /* Handle form submission */
  const handleSubmit = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/save-match-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: user.telegramId,
          ageRanges, // Send age ranges for each sport
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNotification('Match preferences saved successfully!');
        setTimeout(() => setNotification(''), 3000);
      } else {
        setError('Failed to save match preferences');
      }
    } catch (err) {
      setError('An error occurred while saving match preferences');
    }
  };

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4 text-black min-h-screen" style={{ backgroundColor: '#d9f8e1' }}>
      <h1 className="text-2xl font-bold mb-4">Match Preferences</h1>

      {/* Loop through the user's selected sports */}
      {Object.keys(user.sports || {}).map((sport) => (
        <div key={sport} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{sport}</h2>
          <p className="mb-2">What is your preferred age range for matching?</p>

          {/* Double range slider for age range */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={18}
              max={60}
              value={ageRanges[sport]?.[0] || 18}
              onChange={(e) =>
                handleAgeRangeChange(sport, Number(e.target.value), ageRanges[sport]?.[1] || 60)
              }
              className="w-full"
            />
            <input
              type="range"
              min={18}
              max={60}
              value={ageRanges[sport]?.[1] || 60}
              onChange={(e) =>
                handleAgeRangeChange(sport, ageRanges[sport]?.[0] || 18, Number(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* Display selected age range */}
          <p className="mt-2 text-center">
            Age range: {ageRanges[sport]?.[0]} - {ageRanges[sport]?.[1]}
          </p>
        </div>
      ))}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Submit
      </button>

      {/* Notification */}
      {notification && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {notification}
        </div>
      )}
    </div>
  );
}