"use client"; // Mark as a Client Component

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
  sports: { [key: string]: string }; // Sports data (JSON-compatible)
  matchPreferences: {
    // Match preferences (JSON-compatible)
    [key: string]: {
      ageRange: [number, number];
      genderPreference: string;
      skillLevels: string[];
      locationPreferences: string[];
    };
  };
}

export default function MatchPreferencesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'validation' | 'success' } | null>(null); // For notifications
  const [ageRanges, setAgeRanges] = useState<{ [key: string]: [number | null, number | null] }>({}); // Store age ranges for each sport
  const [genderPreferences, setGenderPreferences] = useState<{ [key: string]: string }>({}); // Store gender preferences for each sport
  const [skillLevels, setSkillLevels] = useState<{ [key: string]: string[] }>({}); // Store skill levels for each sport
  const [locationPreferences, setLocationPreferences] = useState<{ [key: string]: string[] }>({}); // Store location preferences for each sport

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
              // Parse JSON fields if they are stored as strings
              const sports = typeof data.sports === 'string' ? JSON.parse(data.sports) : data.sports || {};
              const matchPreferences =
                typeof data.matchPreferences === 'string'
                  ? JSON.parse(data.matchPreferences)
                  : data.matchPreferences || {};

              setUser({ ...data, sports, matchPreferences });

              // Initialize age ranges, gender preferences, skill levels, and location preferences for each sport
              const initialAgeRanges: { [key: string]: [number | null, number | null] } = {};
              const initialGenderPreferences: { [key: string]: string } = {};
              const initialSkillLevels: { [key: string]: string[] } = {};
              const initialLocationPreferences: { [key: string]: string[] } = {};

              Object.keys(sports).forEach((sport) => {
                const preferences = matchPreferences[sport] || {};
                initialAgeRanges[sport] = preferences.ageRange || [null, null]; // Default to [null, null]
                initialGenderPreferences[sport] = preferences.genderPreference || ''; // Default to empty string
                initialSkillLevels[sport] = preferences.skillLevels || [];
                initialLocationPreferences[sport] = preferences.locationPreferences || [];
              });

              setAgeRanges(initialAgeRanges);
              setGenderPreferences(initialGenderPreferences);
              setSkillLevels(initialSkillLevels);
              setLocationPreferences(initialLocationPreferences);
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
  const handleAgeRangeChange = (sport: string, type: 'min' | 'max', value: string) => {
    const numericValue = value === '' ? null : parseInt(value, 10); // Allow empty input
    if (numericValue !== null && isNaN(numericValue)) return; // Ignore invalid input

    setAgeRanges((prev) => ({
      ...prev,
      [sport]: type === 'min' ? [numericValue, prev[sport][1]] : [prev[sport][0], numericValue],
    }));
  };

  /* Handle gender preference change for a sport */
  const handleGenderPreferenceChange = (sport: string, preference: string) => {
    setGenderPreferences((prev) => ({
      ...prev,
      [sport]: preference,
    }));
  };

  /* Handle skill level change for a sport */
  const handleSkillLevelChange = (sport: string, level: string, isChecked: boolean) => {
    setSkillLevels((prev) => {
      const updatedLevels = isChecked
        ? [...(prev[sport] || []), level] // Add skill level
        : (prev[sport] || []).filter((l) => l !== level); // Remove skill level
      return {
        ...prev,
        [sport]: updatedLevels,
      };
    });
  };

  /* Handle location preference change for a sport */
  const handleLocationPreferenceChange = (sport: string, location: string, isChecked: boolean) => {
    setLocationPreferences((prev) => {
      const updatedLocations = isChecked
        ? [...(prev[sport] || []), location] // Add location
        : (prev[sport] || []).filter((loc) => loc !== location); // Remove location
      return {
        ...prev,
        [sport]: updatedLocations,
      };
    });
  };

  /* Validate form before submission */
  const validateForm = () => {
    for (const sport of Object.keys(user?.sports || {})) {
      const [minAge, maxAge] = ageRanges[sport] || [null, null];

      // Validate age range
      if (minAge === null || maxAge === null) {
        setNotification({ message: `Please enter both minimum and maximum ages for ${sport}.`, type: 'validation' });
        return false;
      }
      if (minAge < 18 || minAge > 85) {
        setNotification({ message: `Minimum age for ${sport} must be between 18 and 85.`, type: 'validation' });
        return false;
      }
      if (maxAge < 18 || maxAge > 85) {
        setNotification({ message: `Maximum age for ${sport} must be between 18 and 85.`, type: 'validation' });
        return false;
      }
      if (minAge > maxAge) {
        setNotification({ message: `Minimum age for ${sport} cannot be greater than maximum age.`, type: 'validation' });
        return false;
      }

      // Validate gender preference
      if (!genderPreferences[sport]) {
        setNotification({ message: `Please select a gender preference for ${sport}.`, type: 'validation' });
        return false;
      }

      // Validate skill levels
      if ((skillLevels[sport] || []).length === 0) {
        setNotification({ message: `Please select at least one skill level for ${sport}.`, type: 'validation' });
        return false;
      }

      // Validate location preferences
      if ((locationPreferences[sport] || []).length === 0) {
        setNotification({ message: `Please select at least one preferred location for ${sport}.`, type: 'validation' });
        return false;
      }
    }
    return true;
  };

  /* Handle form submission */
  const handleSubmit = async () => {
    if (!user) return;

    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    // Prepare match preferences data
    const matchPreferences: { [key: string]: any } = {};
    Object.keys(user.sports || {}).forEach((sport) => {
      matchPreferences[sport] = {
        ageRange: ageRanges[sport],
        genderPreference: genderPreferences[sport],
        skillLevels: skillLevels[sport],
        locationPreferences: locationPreferences[sport],
      };
    });

    try {
      const res = await fetch('/api/save-match-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: user.telegramId,
          matchPreferences, // Send match preferences as JSON
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ message: 'Match preferences saved successfully!', type: 'success' });
        setTimeout(() => {
          setNotification(null); // Clear notification

          // Close the Telegram Web App
          if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
          }
        }, 1000);
      } else {
        setNotification({ message: 'Failed to save match preferences', type: 'validation' });
      }
    } catch (err) {
      setNotification({ message: 'An error occurred while saving match preferences', type: 'validation' });
    }
  };

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4 text-black min-h-screen relative" style={{ backgroundColor: '#d9f8e1' }}>
      <h1 className="text-2xl font-bold mb-4">Match Preferences</h1>

      {/* Loop through the user's selected sports */}
      {Object.keys(user.sports || {}).map((sport, index) => (
        <div key={sport} className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{sport}</h2>

          {/* Age range question */}
          <p className="mb-2">What is your preferred age range for matching?</p>
          <div className="flex gap-4">
            <div>
              <label htmlFor={`minAge-${sport}`} className="block mb-1">
                Min Age:
              </label>
              <input
                type="number"
                id={`minAge-${sport}`}
                value={ageRanges[sport]?.[0] ?? ''} // Default to empty string
                onChange={(e) => handleAgeRangeChange(sport, 'min', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur(); // Close the keyboard
                  }
                }}
                min={18}
                max={85}
                className="w-20 p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor={`maxAge-${sport}`} className="block mb-1">
                Max Age:
              </label>
              <input
                type="number"
                id={`maxAge-${sport}`}
                value={ageRanges[sport]?.[1] ?? ''} // Default to empty string
                onChange={(e) => handleAgeRangeChange(sport, 'max', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur(); // Close the keyboard
                  }
                }}
                min={18}
                max={85}
                className="w-20 p-2 border rounded"
              />
            </div>
          </div>

          {/* Gender preference question */}
          <p className="mt-4 mb-2">Would you prefer to match with people of the same gender?</p>
          <div className="flex items-center gap-4">
            {['Male', 'Female', 'Either'].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={`genderPreference-${sport}`}
                  value={option}
                  checked={genderPreferences[sport] === option}
                  onChange={() => handleGenderPreferenceChange(sport, option)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>

          {/* Skill level question */}
          <p className="mt-4 mb-2">Choose the skill level of players you'd like to match with:</p>
          <div className="flex flex-col gap-2">
            {['Newbie', 'Beginner', 'Intermediate', 'Pro'].map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(skillLevels[sport] || []).includes(level)}
                  onChange={(e) => handleSkillLevelChange(sport, level, e.target.checked)}
                  className="mr-2"
                />
                {level}
              </label>
            ))}
          </div>

          {/* Location preference question */}
          <p className="mt-4 mb-2">Choose preferred location to find matches:</p>
          <div className="flex flex-col gap-2">
            {['North', 'South', 'East', 'West', 'Central'].map((location) => (
              <label key={location} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(locationPreferences[sport] || []).includes(location)}
                  onChange={(e) => handleLocationPreferenceChange(sport, location, e.target.checked)}
                  className="mr-2"
                />
                {location}
              </label>
            ))}
          </div>

          {/* Add a line break between sports (except after the last sport) */}
          {index < Object.keys(user.sports || {}).length - 1 && (
          <div className="border-b border-gray-300 my-6"></div>
          )}
        </div>
      ))}

      {/* Submit button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Submit
        </button>
      </div>

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
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}