import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AudioSystem } from './AudioSystem';
import { GameLogic } from './GameLogic';
import { VisualMonitor } from './VisualMonitor';
import { useToast } from '@/hooks/use-toast';

export const EchoQuestGame: React.FC<{ difficulty?: 'easy' | 'medium' | 'hard' }> = ({ difficulty = 'easy' }) => {
  // Maze size by difficulty
  const getMazeSize = () => {
    switch (difficulty) {
      case 'easy': return 9;
      case 'medium': return 15;
      case 'hard': return 25;
      default: return 9;
    }
  };

  // Use a state for gameLogic that resets when difficulty changes
  const [gameLogic, setGameLogic] = useState(() => new GameLogic(getMazeSize(), getMazeSize()));
  const [audioSystem] = useState(() => new AudioSystem());
  const [gameState, setGameState] = useState(gameLogic.getGameState());
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [visualMonitorEnabled, setVisualMonitorEnabled] = useState(false);
  const [moveHistory, setMoveHistory] = useState<Array<{ x: number; y: number; timestamp: number }>>([]);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // When difficulty changes, reset the game logic and state
  React.useEffect(() => {
    const logic = new GameLogic(getMazeSize(), getMazeSize());
    setGameLogic(logic);
    setGameState(logic.getGameState());
    setMoveHistory([]);
    setIsAudioInitialized(false);
    setIsCelebrating(false);
  }, [difficulty]);

  // Initialize audio system
  const initializeAudio = useCallback(async () => {
    try {
      await audioSystem.initialize();
      setIsAudioInitialized(true);
      toast({
        title: "Audio Ready",
        description: "EchoQuest audio system initialized. Use arrow keys or WASD to navigate!",
      });
    } catch (error) {
      toast({
        title: "Audio Error",
        description: "Failed to initialize audio. Some sounds may not work.",
        variant: "destructive",
      });
    }
  }, [audioSystem, toast]);

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isAudioInitialized || gameState.gameWon || isCelebrating) return;

    let direction: 'north' | 'south' | 'east' | 'west' | null = null;

    switch (event.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        direction = 'north';
        break;
      case 'arrowdown':
      case 's':
        direction = 'south';
        break;
      case 'arrowright':
      case 'd':
        direction = 'east';
        break;
      case 'arrowleft':
      case 'a':
        direction = 'west';
        break;
      case 'r':
        // Reset game
        resetGame();
        return;
      case 'h':
        // Show help
        showHelp();
        return;
      case 'm':
        // Toggle debug mode
        setDebugMode(prev => !prev);
        return;
    }

    if (direction) {
      event.preventDefault();
      handleMove(direction);
    }
  }, [isAudioInitialized, gameState.gameWon, isCelebrating]);

  const handleMove = useCallback((direction: 'north' | 'south' | 'east' | 'west') => {
    const result = gameLogic.movePlayer(direction);
    const newState = gameLogic.getGameState();
    setGameState(newState);

    // Update move history if move was successful
    if (result.success) {
      setMoveHistory(prev => [
        ...prev,
        {
          x: newState.playerPosition.x,
          y: newState.playerPosition.y,
          timestamp: Date.now()
        }
      ]);
    }

    // Play appropriate sounds
    if (result.hitWall) {
      audioSystem.playSound('wall-collision');
      toast({
        title: "Wall Hit",
        description: "You walked into a wall! Listen for the dripping sound.",
      });
    } else {
      // Play footstep with directional audio
      const panValue = direction === 'east' ? 0.3 : direction === 'west' ? -0.3 : 0;
      audioSystem.playDirectionalFootstep(result.isCorrectDirection, panValue);
      
      // Play open space echo
      audioSystem.playSound('open-space');
      
      // Play goal chime if close
      if (result.distanceToGoal <= 4) {
        audioSystem.playGoalChime(result.distanceToGoal);
      }

      // Check for victory
      if (newState.gameWon) {
        setIsCelebrating(true);
        setTimeout(() => {
          // Play celebration fanfare
          audioSystem.playCelebration();
          
          // Calculate performance score
          const totalCells = newState.maze.reduce((total, row) => 
            total + row.filter(cell => cell === 0).length, 0
          );
          const efficiency = Math.round((totalCells / newState.moveCount) * 100);
          
          toast({
            title: "🎉 VICTORY ACHIEVED! 🎉",
            description: `Congratulations! You found the goal in ${newState.moveCount} moves! Efficiency: ${efficiency}%`,
            duration: 8000, // Show longer for celebration
          });
          
          // Additional score announcement
          setTimeout(() => {
            toast({
              title: "Final Score",
              description: `Total moves: ${newState.moveCount} | Exploration efficiency: ${efficiency}% | Well done!`,
              duration: 6000,
            });
          }, 3000);
        }, 200);
        
        // Allow new game after 3 seconds of celebration
        setTimeout(() => {
          setIsCelebrating(false);
          toast({
            title: "Ready for New Game",
            description: "Press any key to start a new game!",
            duration: 3000,
          });
        }, 3000);
      }
    }
  }, [gameLogic, audioSystem, toast]);

  // In resetGame, use the current difficulty
  const resetGame = useCallback(() => {
    const logic = new GameLogic(getMazeSize(), getMazeSize());
    setGameLogic(logic);
    setGameState(logic.getGameState());
    setMoveHistory([]);
    setIsCelebrating(false);
    toast({
      title: "Game Reset",
      description: "New maze generated. Find the goal using sound cues!",
    });
  }, [toast, difficulty]);

  const showHelp = useCallback(() => {
    toast({
      title: "EchoQuest Controls",
      description: "Arrow Keys/WASD: Move | R: Reset | H: Help | M: Toggle Debug",
    });
  }, [toast]);

  // Set up event listeners
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.focus();
    }

    // Handler for initializing audio or resetting after win
    const handleAnyKey = async (event: KeyboardEvent) => {
      if (!isAudioInitialized) {
        await initializeAudio();
      } else if (gameState.gameWon && !isCelebrating) {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keydown', handleAnyKey);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keydown', handleAnyKey);
    };
  }, [handleKeyPress, isAudioInitialized, gameState.gameWon, isCelebrating, initializeAudio, resetGame]);

  // Auto-play goal chime on game start
  useEffect(() => {
    if (isAudioInitialized && !gameState.gameWon) {
      const distance = Math.abs(gameState.playerPosition.x - gameState.goalPosition.x) + 
                      Math.abs(gameState.playerPosition.y - gameState.goalPosition.y);
      if (distance <= 4) {
        audioSystem.playGoalChime(distance);
      }
    }
  }, [isAudioInitialized, audioSystem, gameState]);

  const renderMaze = () => {
    if (!debugMode) return null;

    return (
      <div className="font-mono text-sm bg-muted p-4 rounded-md">
        <div className="mb-2 text-muted-foreground">Debug View (Press M to toggle):</div>
        <pre className="whitespace-pre leading-tight">
          {gameLogic.getMazeString()}
        </pre>
        <div className="mt-2 text-xs text-muted-foreground">
          P = Player | G = Goal | █ = Wall | · = Empty
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={gameRef}
      tabIndex={0}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 p-4 focus:outline-none"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-echo-primary to-echo-accent bg-clip-text text-transparent">
            EchoQuest
          </h1>
          <p className="text-xl text-echo-secondary">The Sound Navigation Challenge</p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Navigate the maze using only sound. No visuals - just your ears and spatial awareness.
          </p>
        </div>

        {/* Audio Initialization */}
        {!isAudioInitialized && (
          <Card className="p-6 border-echo-primary/50 bg-gradient-to-r from-echo-primary/10 to-echo-secondary/10">
            <div className="text-center space-y-4">
              <div className="text-lg font-semibold">Ready to Begin?</div>
              <p className="text-muted-foreground">
                Click the button below to initialize the audio system and start your journey.
              </p>
              <Button 
                onClick={initializeAudio}
                className="bg-echo-primary hover:bg-echo-primary/90 text-primary-foreground font-semibold px-8 py-3"
              >
                Start EchoQuest
              </Button>
            </div>
          </Card>
        )}

        {/* Game Instructions */}
        {isAudioInitialized && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-echo-primary">How to Play</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Controls:</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Arrow Keys or WASD to move</li>
                  <li>• R to reset game</li>
                  <li>• H for help</li>
                  <li>• M to toggle debug view</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Audio Cues:</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Footsteps: Louder when going the right way</li>
                  <li>• Dripping: You hit a wall</li>
                  <li>• Echo: Open space around you</li>
                  <li>• Chime: Getting closer to the goal</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Game Status & Visual Monitor Toggle */}
        {isAudioInitialized && (
          <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Moves: <span className="font-semibold text-foreground">{gameState.moveCount}</span>
              </div>
              {gameState.gameWon && (
                <div className="text-echo-success font-semibold animate-sound-pulse">
                  🎉 Victory! Goal Found!
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={showHelp}>
                  Help
                </Button>
                <Button variant="outline" size="sm" onClick={resetGame}>
                  New Game
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Visual Monitor Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="visual-monitor" className="text-sm font-medium">
                  Visual Monitor for Assistants
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enable visual tracking for teachers, parents, or helpers to monitor progress
                </p>
              </div>
              <Switch
                id="visual-monitor"
                checked={visualMonitorEnabled}
                onCheckedChange={setVisualMonitorEnabled}
              />
            </div>
          </Card>
        )}

        {/* Visual Monitor Interface */}
        <VisualMonitor 
          gameState={gameState}
          moveHistory={moveHistory}
          isVisible={visualMonitorEnabled && isAudioInitialized}
        />

        {/* Debug Maze View */}
        {renderMaze()}

        {/* Accessibility Notice */}
        <Card className="p-4 bg-muted/50">
          <div className="text-center text-sm text-muted-foreground">
            <p>🔊 This game is designed for audio-first navigation.</p>
            <p>Use headphones for the best spatial audio experience.</p>
          </div>
        </Card>
      </div>
    </div>
  );
};