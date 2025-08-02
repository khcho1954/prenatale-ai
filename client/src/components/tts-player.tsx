import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { PrenaPlanModal } from '@/components/prena-plan-modal';

interface TTSPlayerProps {
  audioUrl: string;
  title: string;
  isUCT?: boolean;
}

export default function TTSPlayer({ audioUrl, title, isUCT = false }: TTSPlayerProps) {
  const { t } = useLanguage();
  const { hasPrenaPlan, isAuthenticated } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrenaPlanModal, setShowPrenaPlanModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Debug audio URL
  console.log('TTS Player audioUrl:', audioUrl);

  // UCT stories don't support TTS yet
  if (isUCT) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-[12px] text-[#6b7280]">
              {t('ttsNotSupported')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No audio URL available
  if (!audioUrl) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-600">
              {t('audioNotAvailable')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const togglePlayPause = async () => {
    // Check if user has Prena plan access for TTS feature
    if (!hasPrenaPlan) {
      setShowPrenaPlanModal(true);
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      setError(null);
      
      try {
        // Reset audio before playing if it was interrupted
        if (audioRef.current.currentTime > 0 && audioRef.current.ended) {
          audioRef.current.currentTime = 0;
        }
        
        await audioRef.current.play();
      } catch (err) {
        console.error('Audio play error:', err);
        setError(t('audioPlayError'));
        setIsLoading(false);
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(false);
    setError(null);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoading(false);
  };

  const handleError = () => {
    const audio = audioRef.current;
    if (audio) {
      console.log('Audio error details:', {
        url: audioUrl,
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        currentTime: audio.currentTime,
        duration: audio.duration
      });
    }
    setError(t('audioLoadError'));
    setIsLoading(false);
    setIsPlaying(false);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          disabled={isLoading || !!error}
          className="w-10 h-10 rounded-full bg-lavender hover:bg-lavender/90 text-white flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </Button>

        {/* Progress and Controls */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRestart}
                disabled={!duration || isLoading}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <span className="text-xs text-gray-500 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="bg-lavender h-2 rounded-full transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* Volume Icon */}
        <Volume2 className="w-5 h-5 text-gray-400" />
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onStalled={() => console.log('Audio stalled')}
        onSuspend={() => console.log('Audio suspended')}
        onAbort={() => console.log('Audio aborted')}
        onCanPlay={() => console.log('Audio can play')}
        onLoadStart={() => console.log('Audio load started')}
        onProgress={() => console.log('Audio progress')}
        preload="metadata"
        crossOrigin="anonymous"
      />

      <PrenaPlanModal
        isOpen={showPrenaPlanModal}
        onClose={() => setShowPrenaPlanModal(false)}
        feature="tts"
      />
    </div>
  );
}