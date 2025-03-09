'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';
import { addDocument, uploadFile } from '../../../lib/firebase/firebaseUtils';
import { 
  ImageUp, Loader2, MapPin, Tag, Calendar, Clock, X, 
  ChevronDown, Users, Info 
} from 'lucide-react';
import Image from 'next/image';
import { AuthProvider } from '../../../lib/contexts/AuthContext';
import Navigation from '../../../components/Navigation';
import Link from 'next/link';

export default function CreateEventPage() {
  return (
    <AuthProvider>
      <CreateEventContent />
    </AuthProvider>
  );
}

function CreateEventContent() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Get current date and time for defaults
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Format time as HH:MM
  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };
  
  // Event details state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState(formatDate(now));
  const [startTime, setStartTime] = useState(formatTime(now));
  const [endDate, setEndDate] = useState(formatDate(oneHourLater));
  const [endTime, setEndTime] = useState(formatTime(oneHourLater));
  const [isPublic, setIsPublic] = useState(true);
  
  // Cover image state
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  // Location state
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setError(null);
  };
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Failed to get your location. Please try again.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };
  
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate first step
      if (!name.trim()) {
        setError('Event name is required');
        return;
      }
      if (!description.trim()) {
        setError('Event description is required');
        return;
      }
    } else if (currentStep === 2) {
      // Validate second step - venue is now optional
      if (!startDate || !startTime) {
        setError('Start date and time are required');
        return;
      }
      if (!endDate || !endTime) {
        setError('End date and time are required');
        return;
      }
      
      // Validate that end date/time is after start date/time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (endDateTime <= startDateTime) {
        setError('End date/time must be after start date/time');
        return;
      }
    }
    
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Final validation - venue is now optional
    if (!name.trim() || !description.trim() || 
        !startDate || !startTime || !endDate || !endTime) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let coverImageURL = '';
      
      if (coverImage) {
        try {
          const path = `events/${user.uid}/${Date.now()}_${coverImage.name}`;
          coverImageURL = await uploadFile(coverImage, path);
        } catch (uploadError) {
          console.error('Error uploading cover image:', uploadError);
          // Continue with event creation even if image upload fails
        }
      }
      
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      // Generate a unique access code for private events
      const accessCode = !isPublic ? generateAccessCode() : null;

      const eventData: any = {
        name: name.trim(),
        description: description.trim(),
        location: {
          venue: venue.trim() || 'TBD', // Default value if empty
          address: address.trim(),
          ...(location && { 
            latitude: location.latitude,
            longitude: location.longitude
          })
        },
        timeRange: {
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        },
        tags: tags,
        participantCount: 1, // Start with the creator
        postCount: 0,
        participants: [{
          id: user.uid,
          name: user.displayName || 'Anonymous',
          photoURL: user.photoURL || ''
        }],
        createdBy: user.uid,
        visibility: isPublic ? 'public' : 'private',
        ...(accessCode && { accessCode })
      };
      
      // Only add coverImage if it was successfully uploaded
      if (coverImageURL) {
        eventData.coverImage = coverImageURL;
      }

      const result = await addDocument('events', eventData);
      
      if (!result.success) {
        throw new Error(result.error ? result.error.toString() : 'Failed to create event');
      }

      // Redirect to the new event page
      router.push(`/events/${result.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Generate a random access code for private events
  const generateAccessCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  return (
    <div className="pb-20 max-w-screen-md mx-auto">
      <div className="p-4">
        <header className="mb-6 flex items-center">
          <Link href="/events" className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Create Event</h1>
        </header>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index}
                className={`flex-1 h-1 ${
                  index + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                } ${index > 0 ? 'ml-1' : ''}`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-gray-500">
            Step {currentStep} of {totalSteps}: 
            {currentStep === 1 && ' Basic Details'}
            {currentStep === 2 && ' Location & Time'}
            {currentStep === 3 && ' Finalize'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name*
                </label>
                <input
                  type="text"
                  placeholder="Give your event a name"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  placeholder="What's this event about?"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {coverImagePreview ? (
                    <div className="relative">
                      <div className="relative w-full h-48">
                        <Image 
                          src={coverImagePreview} 
                          alt="Cover Preview" 
                          fill 
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-1 rounded-full"
                        onClick={() => {
                          setCoverImage(null);
                          setCoverImagePreview(null);
                        }}
                        disabled={isSubmitting}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="text-gray-500 mb-2">
                        <ImageUp className="h-10 w-10 mx-auto mb-2" />
                        <p>Click to upload a cover image</p>
                        <p className="text-xs">(Max size: 10MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverImageChange}
                        disabled={isSubmitting}
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <div key={index} className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Add a tag and press Enter"
                    className="flex-1 p-2 border border-gray-300 rounded-l-lg text-sm focus:outline-none focus:border-blue-500"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="bg-gray-100 px-3 py-2 rounded-r-lg border border-l-0 border-gray-300 text-sm"
                    onClick={addTag}
                    disabled={!tagInput.trim() || isSubmitting}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Location & Time */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Where is the event taking place?"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Street address, city, state, zip"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="mb-4">
                <button
                  type="button"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm ${
                    location ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={getCurrentLocation}
                  disabled={isSubmitting || isGettingLocation}
                >
                  <MapPin className="h-4 w-4" />
                  <span>{location ? 'Location Added' : 'Add Precise Location'}</span>
                  {isGettingLocation && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                </button>
                
                {location && (
                  <div className="mt-2 text-xs text-gray-500">
                    Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time*
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <input
                    type="time"
                    className="w-32 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time*
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <input
                    type="time"
                    className="w-32 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Finalize */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Event Visibility</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="public"
                      name="visibility"
                      className="h-4 w-4 text-blue-600"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="public" className="ml-2 text-sm text-gray-700">
                      Public (visible to everyone)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="private"
                      name="visibility"
                      className="h-4 w-4 text-blue-600"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="private" className="ml-2 text-sm text-gray-700">
                      Private (invite only)
                    </label>
                  </div>
                </div>
                {!isPublic && (
                  <p className="mt-2 text-sm text-gray-500">
                    A unique link will be generated for you to share with invited participants.
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Review Event Details</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{startDate} {startTime} - {endDate} {endTime}</span>
                    </div>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{venue || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                onClick={prevStep}
                disabled={isSubmitting}
              >
                Back
              </button>
            ) : (
              <Link 
                href="/events"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            )}
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Event'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
      <Navigation />
    </div>
  );
} 