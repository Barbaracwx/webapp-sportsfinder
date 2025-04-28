"use client"; // Mark as a Client Component

import { useEffect, useState } from 'react';
import { WebApp } from '@twa-dev/types';
import DualRangeSlider from "../../dual-range-slider";

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
      ageRange: {
        min: number
        max: number
      }
      genderPreference: string;
      skillLevels: string[];
      locationPreferences: string[];
    };
  };
}

export default function MatchPreferencesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ageRanges, setAgeRanges] = useState<{ [key: string]: [number, number] }>({});
  const [genderPreferences, setGenderPreferences] = useState<{ [key: string]: string }>({});
  const [skillLevels, setSkillLevels] = useState<{ [key: string]: string[] }>({});
  const [locationPreferences, setLocationPreferences] = useState<{ [key: string]: string[] }>({});
  const [notification, setNotification] = useState<{ message: string; type: 'validation' | 'success'; showCloseButton?: boolean } | null>(null); // For notifications

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
              const sports = typeof data.sports === 'string' ? JSON.parse(data.sports) : data.sports || {};
              const matchPreferences =
                typeof data.matchPreferences === 'string'
                  ? JSON.parse(data.matchPreferences)
                  : data.matchPreferences || {};

              setUser({ ...data, sports, matchPreferences });

              // Initialize preferences
              const initialAgeRanges: { [key: string]: [number, number] } = {};
              const initialGenderPreferences: { [key: string]: string } = {};
              const initialSkillLevels: { [key: string]: string[] } = {};
              const initialLocationPreferences: { [key: string]: string[] } = {};

              Object.keys(sports).forEach((sport) => {
                const preferences = matchPreferences[sport] || {};
                initialAgeRanges[sport] = Array.isArray(preferences.ageRange) 
                  ? preferences.ageRange 
                  : preferences.ageRange 
                    ? [preferences.ageRange.min, preferences.ageRange.max] 
                    : [18, 85];
                initialGenderPreferences[sport] = preferences.genderPreference || '';
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
  const handleAgeRangeChange = (sport: string, minAge: number, maxAge: number) => {
    setAgeRanges(prev => ({
      ...prev,
      [sport]: [minAge, maxAge]
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
        ? [...(prev[sport] || []), level]
        : (prev[sport] || []).filter((l) => l !== level);
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
        ? [...(prev[sport] || []), location]
        : (prev[sport] || []).filter((loc) => loc !== location);
      return {
        ...prev,
        [sport]: updatedLocations,
      };
    });
  };

  /* Validate form before submission */
  const validateForm = () => {
    if (!user) return false;

    for (const sport of Object.keys(user.sports)) {
      const ageRange = ageRanges[sport] || [0, 0];
      const [minAge, maxAge] = ageRange;

      // Validate age range
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

    if (!validateForm()) {
      return;
    }

    // Prepare match preferences data
    const matchPreferences: { [key: string]: any } = {};
    Object.keys(user.sports).forEach((sport) => {
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
          matchPreferences,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNotification({ 
          message: `Match preferences saved successfully! \nStart finding your match using /matchme! You can explore our other commands in the menu below.`,
          type: 'success',
          showCloseButton: true // Add this property to show the close button
        });
      } else {
        setNotification({ message: 'Failed to save match preferences', type: 'validation' });
      }
    } catch (err) {
      setNotification({ message: 'An error occurred while saving match preferences', type: 'validation' });
    }
  };

    /* Handle closing the Telegram Web App */
    const handleCloseWebApp = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.close();
      }
    };
  

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>;
  
  return (
    <div className="container mx-auto p-4 text-black min-h-screen relative" style={{ backgroundColor: '#F0F9F0' }}>
      <h1 className="text-2xl font-bold mb-4 text-center">Match Preferences</h1>
  
      {Object.keys(user.sports).map((sport, index) => {
        const currentAgeRange = ageRanges[sport] || [18, 85];
        
        return (
          <div key={sport} className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-center">{sport}</h2>
  
            {/* Age Range Section */}
            <div className="mt-6">
              <p className="block text-lg font-medium mb-2">What is your preferred age range for matching?</p>
              <p className="text-center font-semibold mb-4">
              {currentAgeRange[0]} - {currentAgeRange[1]} years old
              </p>
              <div className="px-3 py-6">
                <DualRangeSlider
                  min={18}
                  max={85}
                  minValue={currentAgeRange[0]}
                  maxValue={currentAgeRange[1]}
                  onChange={(min, max) => handleAgeRangeChange(sport, min, max)}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs">18</span>
                  <span className="text-xs">85</span>
                </div>
              </div>
            </div>
  
            {/* Gender Preference Section */}
            <div className="mt-6">
              <p className="block text-lg font-medium mb-2">Would you prefer to match with people of the same gender?</p>
              <div className="flex gap-4">
                {['Male', 'Female', 'Either'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleGenderPreferenceChange(sport, option)}
                    className={`flex-1 py-2 px-4 rounded-full ${
                      genderPreferences[sport] === option 
                        ? 'bg-[#B3D250]'
                        : 'bg-[#E8F4BE]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Level Section */}
            <div className="mt-6">
              <p className="block text-lg font-medium mb-2">Choose the skill level of players you'd like to match with:</p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  {['Newbie', 'Beginner'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleSkillLevelChange(
                        sport, 
                        level, 
                        !(skillLevels[sport] || []).includes(level)
                  )}
                      className={`flex-1 py-2 px-4 rounded-full ${
                        (skillLevels[sport] || []).includes(level)
                          ? 'bg-[#B3D250]'
                          : 'bg-[#E8F4BE]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  {['Intermediate', 'Pro'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleSkillLevelChange(
                        sport, 
                        level, 
                        !(skillLevels[sport] || []).includes(level)
                      )}
                      className={`flex-1 py-2 px-4 rounded-full ${
                        (skillLevels[sport] || []).includes(level)
                          ? 'bg-[#B3D250]'
                          : 'bg-[#E8F4BE]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location Preference Section */}
            <div className="mt-6">
              <p className="block text-lg font-medium mb-2">Choose preferred location to find matches:</p>
              <div className="space-y-4">
                <div className="flex gap-4 justify-center">
                  {['North', 'South', 'East'].map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() =>
                        handleLocationPreferenceChange(
                          sport,
                          location,
                          !(locationPreferences[sport] || []).includes(location)
                  )}
                      className={`w-24 py-2 px-4 rounded-full ${
                        (locationPreferences[sport] || []).includes(location)
                          ? 'bg-[#B3D250]'
                          : 'bg-[#E8F4BE]'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4 justify-center">
                  <div className="w-26"></div>
                  {['West', 'Central'].map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() =>
                        handleLocationPreferenceChange(
                          sport,
                          location,
                          !(locationPreferences[sport] || []).includes(location)
                        )
                      }
                      className={`w-24 py-2 px-4 rounded-full ${
                        (locationPreferences[sport] || []).includes(location)
                          ? 'bg-[#B3D250]'
                          : 'bg-[#E8F4BE]'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                  <div className="w-26"></div>
                </div>
              </div>
            </div>

            {index < Object.keys(user.sports).length - 1 && (
              <div className="border-b border-gray-300 my-6"></div>
            )}
          </div>
        );
      })}
  
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          className="w-1/2 py-4 px-6 rounded-full bg-[#B3D250] hover:bg-[#B3D250] active:bg-[#98b73d] text-black font-bold text-lg transition-colors duration-200"
        >
          Save!
        </button>
      </div>

      {/* Copyright Footer */}
      <div className="text-center mt-8 mb-4 text-gray-600 text-sm">
        <p>&copy; 2025 SportsFinder</p>
      </div>
  
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
                        {notification.type === 'success' && notification.showCloseButton && (
              <button
                onClick={handleCloseWebApp} // Close the Telegram Web App
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