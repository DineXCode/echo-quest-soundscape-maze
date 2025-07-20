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

  constructor(width: number = 21, height: number = 21) {
    this.state = {
      playerPosition: { x: 1, y: 1 },
      goalPosition: { x: width - 2, y: height - 2 },
      maze: this.generateMaze(width, height),
      gameWon: false,
      moveCount: 0
    };
  }

  private generateMaze(width: number, height: number): number[][] {
    // Ensure odd dimensions for proper maze structure
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;
    const maze: number[][] = [];
    // Initialize with walls
    for (let y = 0; y < height; y++) {
      maze[y] = [];
      for (let x = 0; x < width; x++) {
        maze[y][x] = this.CELL_WALL;
      }
    }
    // Generate a random maze using DFS
    this.generateMazeDFS(maze, 1, 1);
    return maze;
  }

  // Randomized DFS maze generation
  private generateMazeDFS(maze: number[][], startX: number, startY: number): void {
    const width = maze[0].length;
    const height = maze.length;
    const stack: [number, number][] = [];
    stack.push([startX, startY]);
    maze[startY][startX] = this.CELL_EMPTY;
    const directions = [
      [0, -2], // North
      [0, 2],  // South
      [2, 0],  // East
      [-2, 0], // West
    ];
    while (stack.length > 0) {
      const [x, y] = stack[stack.length - 1];
      // Shuffle directions
      for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
      }
      let carved = false;
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (
          nx > 0 && nx < width - 1 &&
          ny > 0 && ny < height - 1 &&
          maze[ny][nx] === this.CELL_WALL
        ) {
          maze[ny][nx] = this.CELL_EMPTY;
          maze[y + dy / 2][x + dx / 2] = this.CELL_EMPTY;
          stack.push([nx, ny]);
          carved = true;
          break;
        }
      }
      if (!carved) {
        stack.pop();
      }
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
    // Use BFS to find the shortest path from player to goal
    const { playerPosition, goalPosition, maze } = this.state;
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
          maze[ny][nx] === this.CELL_EMPTY &&
          !visited[ny][nx]
        ) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny, dist: dist + 1 });
        }
      }
    }
    // If no path found, return a large number
    return 9999;
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