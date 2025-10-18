import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { PageLayout } from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Edit2, Plus, X, Save } from "lucide-react";
import { useSEO } from "../hooks/useSEO";
import { useMusicPlaylist } from "../hooks/useMusicPlaylist";

interface MusicProps {
  onBack: () => void;
  isEditMode: boolean;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  url: string;
}

const defaultSongs: Song[] = [
  {
    id: "1",
    title: "Summer Nights",
    artist: "Brian's Band",
    duration: "3:45",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "2",
    title: "Electric Dreams",
    artist: "Brian's Band",
    duration: "4:20",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "3",
    title: "Midnight Drive",
    artist: "Brian's Band",
    duration: "3:58",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

export function Music({ onBack, isEditMode }: MusicProps) {
  // Apply SEO for music page
  useSEO('music');
  
  // Supabase music playlist hook
  const { songs, loading, createSong, updateSong, deleteSong } = useMusicPlaylist();
  
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isEditingPlaylist, setIsEditingPlaylist] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    localStorage.setItem('musicPlaylist', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Auto-play next song
      if (currentSongIndex < songs.length - 1) {
        setCurrentSongIndex(currentSongIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSongIndex, songs.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const playPrevious = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (currentSongIndex < songs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddSong = () => {
    const newSong: Song = {
      id: Date.now().toString(),
      title: "New Song",
      artist: "Brian's Band",
      duration: "0:00",
      url: ""
    };
    setSongs([...songs, newSong]);
  };

  const handleRemoveSong = (id: string) => {
    setSongs(songs.filter(song => song.id !== id));
  };

  const handleUpdateSong = (id: string, field: keyof Song, value: string) => {
    setSongs(songs.map(song => 
      song.id === id ? { ...song, [field]: value } : song
    ));
  };

  const currentSong = songs[currentSongIndex];

  return (
    <PageLayout title="Music" onBack={onBack}>
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Player Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-12 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-blue-500/20 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 backdrop-blur-sm rounded-3xl border border-border shadow-2xl"
        >
          {/* Album Art */}
          <div className="aspect-square max-w-md mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/30">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" />
                  <circle cx="100" cy="100" r="20" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          {/* Song Info */}
          <div className="text-center mb-8">
            <h2 className="mb-2">{currentSong?.title || "No song selected"}</h2>
            <p className="text-muted-foreground">{currentSong?.artist || ""}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <Button
              size="lg"
              variant="ghost"
              onClick={playPrevious}
              disabled={currentSongIndex === 0}
              className="rounded-full w-14 h-14"
            >
              <SkipBack className="w-6 h-6" />
            </Button>
            
            <Button
              size="lg"
              onClick={togglePlayPause}
              className="rounded-full w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={!currentSong}
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              onClick={playNext}
              disabled={currentSongIndex === songs.length - 1}
              className="rounded-full w-14 h-14"
            >
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4 max-w-xs mx-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="rounded-full"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground min-w-[3ch]">{volume}</span>
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentSong?.url}
            preload="metadata"
          />
        </motion.div>

        {/* Playlist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-8 bg-gradient-to-br from-slate-50/10 via-white/15 to-gray-50/8 dark:from-slate-800/5 dark:via-slate-900/10 dark:to-slate-800/3 backdrop-blur-md rounded-2xl border border-border/30 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3>Playlist</h3>
            {isEditMode && (
              <div className="flex gap-2">
                {!isEditingPlaylist && (
                  <Button
                    onClick={() => setIsEditingPlaylist(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isEditingPlaylist && (
                  <>
                    <Button
                      onClick={handleAddSong}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Song
                    </Button>
                    <Button
                      onClick={() => setIsEditingPlaylist(false)}
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Done
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className={`p-4 rounded-xl transition-all cursor-pointer ${
                  index === currentSongIndex
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                    : 'hover:bg-white/10 dark:hover:bg-slate-800/10'
                }`}
                onClick={() => {
                  if (!isEditingPlaylist) {
                    setCurrentSongIndex(index);
                    setIsPlaying(true);
                  }
                }}
              >
                {isEditingPlaylist ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={song.title}
                      onChange={(e) => handleUpdateSong(song.id, 'title', e.target.value)}
                      placeholder="Song title"
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Input
                      value={song.artist}
                      onChange={(e) => handleUpdateSong(song.id, 'artist', e.target.value)}
                      placeholder="Artist"
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Input
                      value={song.url}
                      onChange={(e) => handleUpdateSong(song.id, 'url', e.target.value)}
                      placeholder="Audio URL"
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSong(song.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground min-w-[2ch]">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{song.title}</p>
                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{song.duration}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}

export default Music;
