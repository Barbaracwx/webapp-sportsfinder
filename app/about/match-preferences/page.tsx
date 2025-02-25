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
  const [notification, setNotification] = useState<string | null>(null); // For success/error notifications
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
                initialAgeRanges[sport] = [1, 60]; // Default age range for each sport (min: 1, max: 60)
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

    // Validate age ranges before submission
    for (const sport of Object.keys(ageRanges)) {
      const [min, max] = ageRanges[sport];
      if (min > max) {
        setNotification(`Invalid age range for ${sport}: Minimum age cannot be greater than maximum age.`);
        return; // Stop submission if any range is invalid
      }
    }

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
        setTimeout(() => setNotification(null), 3000); // Clear notification after 3 seconds
      } else {
        setNotification('Failed to save match preferences');
      }
    } catch (err) {
      setNotification('An error occurred while saving match preferences');
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
              min={1} // Minimum age range set to 1
              max={100} // Maximum age range set to 60
              value={ageRanges[sport]?.[0] || 1} // Default to 1 if not set
              onChange={(e) => {
                const newMin = Number(e.target.value);
                const currentMax = ageRanges[sport]?.[1] || 100;
                handleAgeRangeChange(sport, newMin, currentMax);
              }}
              className="w-full"
            />
            <input
              type="range"
              min={1} // Minimum age range set to 1
              max={60} // Maximum age range set to 60
              value={ageRanges[sport]?.[1] || 60} // Default to 60 if not set
              onChange={(e) => {
                const newMax = Number(e.target.value);
                const currentMin = ageRanges[sport]?.[0] || 1;
                handleAgeRangeChange(sport, currentMin, newMax);
              }}
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
        <div className="mt-4 p-2 bg-yellow-100 text-yellow-700 rounded flex justify-between items-center">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)} // Close the notification
            className="text-yellow-700 hover:text-yellow-900"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}