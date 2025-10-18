import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { migrateLocalStorageToSupabase } from '../utils/migrateToSupabase';
import { populateProfileWithHardcodedData } from '../utils/updateProfileData';
import { clearAllData, clearLocalStorageOnly } from '../utils/clearCorruptedData';
import AuthTest from './AuthTest';
import { DataImporter } from './DataImporter';
import QuickAuth from './QuickAuth';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileStatus, setProfileStatus] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState<string>('');
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .limit(5);

        if (error) {
          setError(error.message);
          setConnectionStatus(`Error: ${error.message}`);
        } else {
          setConnectionStatus('✅ Connected to Supabase!');
          setProjects(data || []);
        }
      } catch (err: any) {
        setError(err.message);
        setConnectionStatus(`Connection failed: ${err.message}`);
      }
    };

    testConnection();
  }, []);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationStatus('Starting migration...');
    
    try {
      const result = await migrateLocalStorageToSupabase();
      
      if (result.success) {
        setMigrationStatus(`✅ Migration successful! Migrated ${result.migratedCount} projects.`);
        // Refresh projects list
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .limit(10);
        
        if (!error) {
          setProjects(data || []);
        }
      } else {
        setMigrationStatus(`❌ Migration failed: ${result.error}`);
      }
    } catch (error: any) {
      setMigrationStatus(`❌ Migration error: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    setProfileStatus('Updating profile with hardcoded data...');
    
    try {
      await populateProfileWithHardcodedData();
      setProfileStatus('✅ Profile updated successfully! The About page should now show content.');
    } catch (error: any) {
      setProfileStatus(`❌ Profile update failed: ${error.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleClearAllData = async () => {
    setIsCleaning(true);
    setCleanupStatus('Clearing all data...');
    
    try {
      const result = await clearAllData();
      if (result.success) {
        setCleanupStatus('✅ All data cleared! Please refresh the page.');
      } else {
        setCleanupStatus(`❌ Cleanup failed: ${result.error}`);
      }
    } catch (error: any) {
      setCleanupStatus(`❌ Cleanup error: ${error.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleClearLocalStorage = async () => {
    setIsCleaning(true);
    setCleanupStatus('Clearing localStorage...');
    
    try {
      const result = await clearLocalStorageOnly();
      if (result.success) {
        setCleanupStatus('✅ localStorage cleared! Please refresh the page.');
      } else {
        setCleanupStatus(`❌ Cleanup failed: ${result.error}`);
      }
    } catch (error: any) {
      setCleanupStatus(`❌ Cleanup error: ${error.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  // Show authentication if not logged in
  if (!user) {
    return <AuthTest />;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className="text-lg">{connectionStatus}</p>
        {error && (
          <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
        <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Projects from Database</h2>
        {projects.length > 0 ? (
          <div>
            <p className="mb-2">Found {projects.length} projects:</p>
            <ul className="list-disc list-inside">
              {projects.map((project, index) => (
                <li key={project.id || index}>
                  {project.title || 'Untitled'} - {project.published ? 'Published' : 'Draft'}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No projects found in database.</p>
        )}
      </div>

      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Migration Tool</h2>
        <p className="mb-4">Migrate your localStorage data to Supabase:</p>
        <button
          onClick={handleMigration}
          disabled={isMigrating}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {isMigrating ? 'Migrating...' : 'Migrate localStorage to Supabase'}
        </button>
        {migrationStatus && (
          <div className="mt-4 p-2 bg-white rounded border">
            {migrationStatus}
          </div>
        )}
      </div>

      <QuickAuth />

      <div className="bg-green-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Importer</h2>
        <p className="mb-4">Import your portfolio data from JSON files or localStorage:</p>
        <DataImporter />
      </div>

      <div className="bg-purple-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Profile Data Fix</h2>
        <p className="mb-4">If your About page is empty, click this button to populate it with hardcoded content:</p>
        <button
          onClick={handleUpdateProfile}
          disabled={isUpdatingProfile}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {isUpdatingProfile ? 'Updating...' : 'Populate About Page Content'}
        </button>
        {profileStatus && (
          <div className="mt-4 p-2 bg-white rounded border">
            {profileStatus}
          </div>
        )}
      </div>

      <div className="bg-red-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Data Cleanup (Fix Corruption)</h2>
        <p className="mb-4">If you're getting corruption errors, use these buttons to clear data:</p>
        <div className="space-y-2">
          <button
            onClick={handleClearLocalStorage}
            disabled={isCleaning}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded mr-2"
          >
            {isCleaning ? 'Clearing...' : 'Clear localStorage Only'}
          </button>
          <button
            onClick={handleClearAllData}
            disabled={isCleaning}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
          >
            {isCleaning ? 'Clearing...' : 'Clear All Data (Nuclear Option)'}
          </button>
        </div>
        {cleanupStatus && (
          <div className="mt-4 p-2 bg-white rounded border">
            {cleanupStatus}
          </div>
        )}
      </div>
    </div>
  );
}