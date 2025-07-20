import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameState } from './GameLogic';
import { GameLogic } from './GameLogic';

interface VisualMonitorProps {
  gameState: GameState;
  moveHistory: Array<{ x: number; y: number; timestamp: number }>;
  isVisible: boolean;
}

export const VisualMonitor: React.FC<VisualMonitorProps> = ({
  gameState,
  moveHistory,
  isVisible
}) => {
  if (!isVisible) return null;

  const renderMazeCell = (x: number, y: number, cellValue: number) => {
    const isPlayer = gameState.playerPosition.x === x && gameState.playerPosition.y === y;
    const isGoal = gameState.goalPosition.x === x && gameState.goalPosition.y === y;
    const visitCount = moveHistory.filter(pos => pos.x === x && pos.y === y).length;
    const hasBeenVisited = visitCount > 0;

    let cellClass = "w-8 h-8 border border-border/30 flex items-center justify-center text-xs font-mono transition-all duration-200";
    let content = "";
    
    if (cellValue === 1) {
      // Wall
      cellClass += " bg-muted text-muted-foreground";
      content = "█";
    } else {
      // Empty space
      cellClass += " bg-background";
      
      if (isPlayer) {
        cellClass += " bg-echo-primary text-primary-foreground animate-sound-pulse ring-2 ring-echo-primary/50";
        content = "P";
      } else if (isGoal) {
        cellClass += " bg-sound-goal text-primary-foreground animate-goal-glow";
        content = "G";
      } else if (hasBeenVisited) {
        const opacity = Math.min(visitCount * 0.2 + 0.3, 1);
        cellClass += ` bg-echo-secondary/30 text-echo-secondary`;
        content = visitCount > 1 ? visitCount.toString() : "·";
        
        // Recent visits get more emphasis
        const recentVisit = moveHistory.findIndex(pos => pos.x === x && pos.y === y);
        if (recentVisit >= moveHistory.length - 3) {
          cellClass += " ring-1 ring-echo-secondary/50";
        }
      } else {
        content = "·";
      }
    }

    return (
      <div key={`${x}-${y}`} className={cellClass} title={`(${x}, ${y}) - Visits: ${visitCount}`}>
        {content}
      </div>
    );
  };

  // Replace direct distance with shortest path distance
  const getMazeDistanceToGoal = () => {
    // Recreate a GameLogic instance to use its BFS method
    // (or, if gameState has a reference, use that)
    // We'll reconstruct the logic here for now
    const { playerPosition, goalPosition, maze } = gameState;
    const width = maze[0].length;
    const height = maze.length;
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const queue: Array<{ x: number; y: number; dist: number }> = [];
    queue.push({ x: playerPosition.x, y: playerPosition.y, dist: 0 });
    visited[playerPosition.y][playerPosition.x] = true;
    const directions = [
      { dx: 0, dy: -1 }, // North
      { dx: 0, dy: 1 },  // South
      { dx: 1, dy: 0 },  // East
      { dx: -1, dy: 0 }, // West
    ];
    while (queue.length > 0) {
      const { x, y, dist } = queue.shift()!;
      if (x === goalPosition.x && y === goalPosition.y) {
        return dist;
      }
      for (const { dx, dy } of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx >= 0 && nx < width &&
          ny >= 0 && ny < height &&
          maze[ny][nx] === 0 &&
          !visited[ny][nx]
        ) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny, dist: dist + 1 });
        }
      }
    }
    return 9999;
  };

  const distance = getMazeDistanceToGoal();

  const uniquePositionsVisited = new Set(
    moveHistory.map(pos => `${pos.x},${pos.y}`)
  ).size;

  const totalCells = gameState.maze.reduce((total, row) => 
    total + row.filter(cell => cell === 0).length, 0
  );

  const explorationPercentage = Math.round((uniquePositionsVisited / totalCells) * 100);

  const getDistanceColor = (dist: number) => {
    if (dist <= 2) return "text-echo-success";
    if (dist <= 4) return "text-sound-goal";
    if (dist <= 6) return "text-echo-accent";
    return "text-echo-danger";
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-card via-card to-muted/20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-echo-primary">Visual Monitor</h2>
        <Badge variant="outline" className="text-muted-foreground">
          For Assistants & Teachers
        </Badge>
      </div>

      {/* Game Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-echo-primary">{gameState.moveCount}</div>
          <div className="text-xs text-muted-foreground">Total Moves</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className={`text-2xl font-bold ${getDistanceColor(distance)}`}>{distance}</div>
          <div className="text-xs text-muted-foreground">Distance to Goal</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-echo-secondary">{explorationPercentage}%</div>
          <div className="text-xs text-muted-foreground">Maze Explored</div>
        </div>
        
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-echo-accent">{uniquePositionsVisited}</div>
          <div className="text-xs text-muted-foreground">Unique Positions</div>
        </div>
      </div>

      {/* Maze Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Live Maze View</h3>
          {gameState.gameWon && (
            <Badge className="bg-echo-success text-primary-foreground animate-sound-pulse">
              🎉 Goal Reached!
            </Badge>
          )}
        </div>
        
        <div className="bg-background/50 p-4 rounded-lg border overflow-auto">
          <div 
            className="grid gap-0 mx-auto w-fit"
            style={{ 
              gridTemplateColumns: `repeat(${gameState.maze[0].length}, minmax(0, 1fr))` 
            }}
          >
            {gameState.maze.map((row, y) =>
              row.map((cell, x) => renderMazeCell(x, y, cell))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-echo-primary rounded"></div>
            <span>Player (P)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sound-goal rounded"></div>
            <span>Goal (G)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted rounded"></div>
            <span>Wall (█)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-echo-secondary/30 rounded"></div>
            <span>Visited Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-background border rounded"></div>
            <span>Unvisited (·)</span>
          </div>
        </div>
      </div>

      {/* Recent Movement History */}
      {moveHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Recent Moves</h3>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex flex-wrap gap-1 text-xs font-mono">
              {moveHistory.slice(-10).map((move, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-echo-secondary/20 text-echo-secondary rounded"
                >
                  ({move.x},{move.y})
                </span>
              ))}
              {moveHistory.length > 10 && (
                <span className="px-2 py-1 text-muted-foreground">
                  +{moveHistory.length - 10} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Insights */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Navigation Insights</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          {distance <= 2 && (
            <p className="text-echo-success">🎯 Player is very close to the goal!</p>
          )}
          {distance > 10 && (
            <p className="text-echo-danger">🗺️ Player needs guidance - quite far from goal</p>
          )}
          {explorationPercentage > 75 && (
            <p className="text-echo-accent">🔍 Excellent exploration - player has mapped most of the maze</p>
          )}
          {gameState.moveCount > 50 && !gameState.gameWon && (
            <p className="text-echo-secondary">⏱️ Player taking time to navigate - consider offering hints</p>
          )}
          {moveHistory.length > 0 && (
            <p>
              🚶 Last position: ({gameState.playerPosition.x}, {gameState.playerPosition.y})
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};