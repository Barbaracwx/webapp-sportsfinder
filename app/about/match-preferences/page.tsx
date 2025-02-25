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
              setUser(data);

              // Initialize age ranges, gender preferences, skill levels, and location preferences for each sport
              const initialAgeRanges: { [key: string]: [number, number] } = {};
              const initialGenderPreferences: { [key: string]: string } = {};
              const initialSkillLevels: { [key: string]: string[] } = {};
              const initialLocationPreferences: { [key: string]: string[] } = {};
              Object.keys(data.sports || {}).forEach((sport) => {
                initialAgeRanges[sport] = [1, 60]; // Default age range for each sport (min: 1, max: 60)
                initialGenderPreferences[sport] = 'Anything'; // Default gender preference for each sport
                initialSkillLevels[sport] = []; // Default skill levels (empty array)
                initialLocationPreferences[sport] = []; // Default location preferences (empty array)
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
  const handleAgeRangeChange = (sport: string, min: number, max: number) => {
    setAgeRanges((prev) => ({
      ...prev,
      [sport]: [min, max],
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
      // Validate gender preference
      if (!genderPreferences[sport]) {
        setNotification(`Please select a gender preference for ${sport}.`);
        return false;
      }

      // Validate skill levels
      if ((skillLevels[sport] || []).length === 0) {
        setNotification(`Please select at least one skill level for ${sport}.`);
        return false;
      }

      // Validate location preferences
      if ((locationPreferences[sport] || []).length === 0) {
        setNotification(`Please select at least one preferred location for ${sport}.`);
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
          genderPreferences, // Send gender preferences for each sport
          skillLevels, // Send skill levels for each sport
          locationPreferences, // Send location preferences for each sport
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

          {/* Age range question */}
          <p className="mb-2">What is your preferred age range for matching?</p>
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
              max={100} // Maximum age range set to 60
              value={ageRanges[sport]?.[1] || 100} // Default to 60 if not set
              onChange={(e) => {
                const newMax = Number(e.target.value);
                const currentMin = ageRanges[sport]?.[0] || 1;
                handleAgeRangeChange(sport, currentMin, newMax);
              }}
              className="w-full"
            />
          </div>
          <p className="mt-2 text-center">
            Age range: {ageRanges[sport]?.[0]} - {ageRanges[sport]?.[1]}
          </p>

          {/* Gender preference question */}
          <p className="mt-4 mb-2">Would you prefer to match with people of the same gender?</p>
          <div className="flex items-center gap-4">
            {['Male', 'Female', 'Anything'].map((option) => (
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