export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  playerPosition: Position;
  goalPosition: Position;
  maze: number[][];
  gameWon: boolean;
  moveCount: number;
}

export class GameLogic {
  private state: GameState;
  private readonly CELL_EMPTY = 0;
  private readonly CELL_WALL = 1;

  constructor(width: number = 7, height: number = 7) {
    this.state = {
      playerPosition: { x: 1, y: 1 },
      goalPosition: { x: width - 2, y: height - 2 },
      maze: this.generateMaze(width, height),
      gameWon: false,
      moveCount: 0
    };
  }

  private generateMaze(width: number, height: number): number[][] {
    // Create a simple maze with guaranteed path
    const maze: number[][] = [];
    
    // Initialize with walls
    for (let y = 0; y < height; y++) {
      maze[y] = [];
      for (let x = 0; x < width; x++) {
        maze[y][x] = this.CELL_WALL;
      }
    }

    // Create a simple path-based maze
    this.createPath(maze, width, height);
    
    return maze;
  }

  private createPath(maze: number[][], width: number, height: number): void {
    // Simple maze generation - create corridors
    
    // Main horizontal corridor
    for (let x = 1; x < width - 1; x++) {
      maze[1][x] = this.CELL_EMPTY;
      maze[height - 2][x] = this.CELL_EMPTY;
    }
    
    // Main vertical corridor
    for (let y = 1; y < height - 1; y++) {
      maze[y][1] = this.CELL_EMPTY;
      maze[y][width - 2] = this.CELL_EMPTY;
    }
    
    // Create some branches and obstacles
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    
    // Middle cross
    for (let x = 2; x < width - 2; x++) {
      maze[midY][x] = this.CELL_EMPTY;
    }
    for (let y = 2; y < height - 2; y++) {
      maze[y][midX] = this.CELL_EMPTY;
    }
    
    // Add some strategic walls to create challenge
    if (width > 5 && height > 5) {
      maze[2][3] = this.CELL_WALL;
      maze[height - 3][width - 4] = this.CELL_WALL;
    }
  }

  getGameState(): GameState {
    return { ...this.state };
  }

  canMove(direction: 'north' | 'south' | 'east' | 'west'): boolean {
    const newPos = this.getNewPosition(direction);
    return this.isValidPosition(newPos) && 
           this.state.maze[newPos.y][newPos.x] === this.CELL_EMPTY;
  }

  private getNewPosition(direction: 'north' | 'south' | 'east' | 'west'): Position {
    const { x, y } = this.state.playerPosition;
    switch (direction) {
      case 'north': return { x, y: y - 1 };
      case 'south': return { x, y: y + 1 };
      case 'east': return { x: x + 1, y };
      case 'west': return { x: x - 1, y };
    }
  }

  private isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < this.state.maze[0].length &&
           pos.y >= 0 && pos.y < this.state.maze.length;
  }

  movePlayer(direction: 'north' | 'south' | 'east' | 'west'): { 
    success: boolean; 
    hitWall: boolean; 
    isCorrectDirection: boolean;
    distanceToGoal: number;
  } {
    const newPos = this.getNewPosition(direction);
    const hitWall = !this.isValidPosition(newPos) || 
                    this.state.maze[newPos.y][newPos.x] === this.CELL_WALL;
    
    if (hitWall) {
      return { 
        success: false, 
        hitWall: true, 
        isCorrectDirection: false,
        distanceToGoal: this.getDistanceToGoal()
      };
    }

    // Calculate if this is the correct direction (closer to goal)
    const currentDistance = this.getDistanceToGoal();
    const newDistance = this.getDistance(newPos, this.state.goalPosition);
    const isCorrectDirection = newDistance < currentDistance;

    // Move player
    this.state.playerPosition = newPos;
    this.state.moveCount++;

    // Check if player reached goal
    if (newPos.x === this.state.goalPosition.x && 
        newPos.y === this.state.goalPosition.y) {
      this.state.gameWon = true;
    }

    return { 
      success: true, 
      hitWall: false, 
      isCorrectDirection,
      distanceToGoal: newDistance
    };
  }

  private getDistanceToGoal(): number {
    return this.getDistance(this.state.playerPosition, this.state.goalPosition);
  }

  private getDistance(pos1: Position, pos2: Position): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
  }

  resetGame(): void {
    const width = this.state.maze[0].length;
    const height = this.state.maze.length;
    
    this.state = {
      playerPosition: { x: 1, y: 1 },
      goalPosition: { x: width - 2, y: height - 2 },
      maze: this.generateMaze(width, height),
      gameWon: false,
      moveCount: 0
    };
  }

  // Helper method for debugging/development
  getMazeString(): string {
    const maze = this.state.maze.map(row => [...row]);
    maze[this.state.playerPosition.y][this.state.playerPosition.x] = 2; // Player
    maze[this.state.goalPosition.y][this.state.goalPosition.x] = 3; // Goal
    
    return maze.map(row => 
      row.map(cell => {
        switch(cell) {
          case 0: return '·'; // Empty
          case 1: return '█'; // Wall
          case 2: return 'P'; // Player
          case 3: return 'G'; // Goal
          default: return '?';
        }
      }).join(' ')
    ).join('\n');
  }
}