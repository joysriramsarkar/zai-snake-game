'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface Position {
  x: number
  y: number
}

type FruitType = 'apple' | 'banana' | 'orange' | 'grape' | 'cherry'

interface Fruit {
  position: Position
  type: FruitType
  points: number
}

type GameState = 'menu' | 'playing' | 'paused' | 'gameOver'

interface GameData {
  snake: Position[]
  fruits: Fruit[]
  walls: Position[]
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  score: number
  highScore: number
  level: number
  gameSpeed: number
  nextLevelScore: number
}

const GRID_SIZE = 25
const CELL_SIZE = 24
const INITIAL_SPEED = 200
const LEVEL_SPEED_INCREMENT = 8
const SCORE_PER_LEVEL = 1000

const FRUIT_CONFIG: Record<FruitType, { points: number; emoji: string; shadow: string }> = {
  apple: { points: 10, emoji: '🍎', shadow: 'shadow-red-500/50' },
  banana: { points: 20, emoji: '🍌', shadow: 'shadow-yellow-400/50' },
  orange: { points: 30, emoji: '🍊', shadow: 'shadow-orange-500/50' },
  grape: { points: 40, emoji: '🍇', shadow: 'shadow-purple-600/50' },
  cherry: { points: 50, emoji: '🍒', shadow: 'shadow-red-600/50' }
}

// Generate wall patterns for different levels
const generateWalls = (level: number): Position[] => {
  const walls: Position[] = []
  
  if (level >= 2) {
    // Level 2: Add some scattered walls
    const level2Walls = [
      { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 },
      { x: 17, y: 5 }, { x: 18, y: 5 }, { x: 19, y: 5 },
      { x: 5, y: 19 }, { x: 6, y: 19 }, { x: 7, y: 19 },
      { x: 17, y: 19 }, { x: 18, y: 19 }, { x: 19, y: 19 }
    ]
    walls.push(...level2Walls)
  }
  
  if (level >= 3) {
    // Level 3: Add cross pattern
    const level3Walls = [
      { x: 12, y: 8 }, { x: 12, y: 9 }, { x: 12, y: 10 }, { x: 12, y: 11 },
      { x: 12, y: 13 }, { x: 12, y: 14 }, { x: 12, y: 15 }, { x: 12, y: 16 },
      { x: 8, y: 12 }, { x: 9, y: 12 }, { x: 10, y: 12 }, { x: 11, y: 12 },
      { x: 13, y: 12 }, { x: 14, y: 12 }, { x: 15, y: 12 }, { x: 16, y: 12 }
    ]
    walls.push(...level3Walls)
  }
  
  if (level >= 4) {
    // Level 4: Add corner walls
    const level4Walls = [
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 4 },
      { x: 21, y: 3 }, { x: 22, y: 3 }, { x: 22, y: 4 },
      { x: 3, y: 21 }, { x: 3, y: 22 }, { x: 4, y: 22 },
      { x: 21, y: 22 }, { x: 22, y: 21 }, { x: 22, y: 22 }
    ]
    walls.push(...level4Walls)
  }
  
  if (level >= 5) {
    // Level 5: Add maze-like walls
    const level5Walls = [
      { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 },
      { x: 15, y: 2 }, { x: 16, y: 2 }, { x: 17, y: 2 },
      { x: 8, y: 22 }, { x: 9, y: 22 }, { x: 10, y: 22 },
      { x: 15, y: 22 }, { x: 16, y: 22 }, { x: 17, y: 22 },
      { x: 2, y: 8 }, { x: 2, y: 9 }, { x: 2, y: 10 },
      { x: 22, y: 8 }, { x: 22, y: 9 }, { x: 22, y: 10 },
      { x: 2, y: 15 }, { x: 2, y: 16 }, { x: 2, y: 17 },
      { x: 22, y: 15 }, { x: 22, y: 16 }, { x: 22, y: 17 }
    ]
    walls.push(...level5Walls)
  }
  
  return walls
}

const toBengaliNumber = (num: number | string): string => {
  const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (digit) => bengaliNumerals[parseInt(digit)]);
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [gameData, setGameData] = useState<GameData>({
    snake: [{ x: 12, y: 12 }],
    fruits: [],
    walls: [],
    direction: 'RIGHT',
    score: 0,
    highScore: 0,
    level: 1,
    gameSpeed: INITIAL_SPEED,
    nextLevelScore: SCORE_PER_LEVEL
  })

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const directionRef = useRef(gameData.direction)

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore')
    if (savedHighScore) {
      setGameData(prev => ({ ...prev, highScore: parseInt(savedHighScore) }))
    }
  }, [])

  // Save high score to localStorage
  useEffect(() => {
    if (gameData.score > gameData.highScore) {
      localStorage.setItem('snakeHighScore', gameData.score.toString())
      setGameData(prev => ({ ...prev, highScore: gameData.score }))
    }
  }, [gameData.score, gameData.highScore])

  // Generate random fruit
  const generateFruit = useCallback((): Fruit => {
    const fruitTypes: FruitType[] = ['apple', 'banana', 'orange', 'grape', 'cherry']
    const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)]
    
    const position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    }
    
    // Make sure fruit doesn't spawn on snake, other fruits, or walls
    const isOnSnake = gameData.snake.some(segment => 
      segment.x === position.x && segment.y === position.y
    )
    const isOnFruit = gameData.fruits.some(fruit => 
      fruit.position.x === position.x && fruit.position.y === position.y
    )
    const isOnWall = gameData.walls.some(wall => 
      wall.x === position.x && wall.y === position.y
    )
    
    if (isOnSnake || isOnFruit || isOnWall) {
      return generateFruit()
    }
    
    return {
      position,
      type,
      points: FRUIT_CONFIG[type].points
    }
  }, [gameData.snake, gameData.fruits, gameData.walls])

  // Initialize fruits
  useEffect(() => {
    if (gameData.fruits.length === 0 && gameState === 'playing') {
      const initialFruits = []
      for (let i = 0; i < 3; i++) {
        initialFruits.push(generateFruit())
      }
      setGameData(prev => ({ ...prev, fruits: initialFruits }))
    }
  }, [gameData.fruits.length, gameState, generateFruit])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return

      const key = e.key.toLowerCase()
      const currentDirection = directionRef.current

      switch (key) {
        case 'arrowup':
        case 'w':
          if (currentDirection !== 'DOWN') {
            directionRef.current = 'UP'
          }
          break
        case 'arrowdown':
        case 's':
          if (currentDirection !== 'UP') {
            directionRef.current = 'DOWN'
          }
          break
        case 'arrowleft':
        case 'a':
          if (currentDirection !== 'RIGHT') {
            directionRef.current = 'LEFT'
          }
          break
        case 'arrowright':
        case 'd':
          if (currentDirection !== 'LEFT') {
            directionRef.current = 'RIGHT'
          }
          break
        case ' ':
          // Spacebar to pause
          setGameState('paused')
          break
        case 'escape':
          // Escape to menu
          setGameState('menu')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState])

  // Game loop
  const gameLoop = useCallback(() => {
    setGameData(prev => {
      if (gameState !== 'playing') return prev

      const currentDirection = directionRef.current
      const head = { ...prev.snake[0] }
      
      // Move head based on direction
      switch (currentDirection) {
        case 'UP':
          head.y -= 1
          break
        case 'DOWN':
          head.y += 1
          break
        case 'LEFT':
          head.x -= 1
          break
        case 'RIGHT':
          head.x += 1
          break
      }

      // Check wall collision (boundaries)
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameOver')
        return prev
      }

      // Check obstacle wall collision
      if (prev.walls.some(wall => wall.x === head.x && wall.y === head.y)) {
        setGameState('gameOver')
        return prev
      }

      // Check self collision (don't check head against itself)
      if (prev.snake.some((segment, index) => index > 0 && segment.x === head.x && segment.y === head.y)) {
        setGameState('gameOver')
        return prev
      }

      const newSnake = [head, ...prev.snake]
      let newScore = prev.score
      let newFruits = [...prev.fruits]
      let levelUp = false

      // Check if any fruit is eaten
      const eatenFruitIndex = newFruits.findIndex(fruit => 
        fruit.position.x === head.x && fruit.position.y === head.y
      )

      if (eatenFruitIndex !== -1) {
        const eatenFruit = newFruits[eatenFruitIndex]
        newScore += eatenFruit.points
        
        // Remove eaten fruit and add new one
        newFruits.splice(eatenFruitIndex, 1)
        newFruits.push(generateFruit())
        
        // Check for level up
        if (newScore >= prev.nextLevelScore) {
          levelUp = true
        }
        // Snake grows by NOT removing the tail when fruit is eaten
      } else {
        // Remove tail if no fruit eaten (snake moves without growing)
        newSnake.pop()
      }

      // Calculate new level and speed
      let newLevel = prev.level
      let newNextLevelScore = prev.nextLevelScore
      let newGameSpeed = prev.gameSpeed
      let newWalls = [...prev.walls]

      if (levelUp) {
        newLevel += 1
        newNextLevelScore += SCORE_PER_LEVEL
        newGameSpeed = Math.max(80, prev.gameSpeed - LEVEL_SPEED_INCREMENT)
        newWalls = generateWalls(newLevel)
      }

      return {
        ...prev,
        snake: newSnake,
        fruits: newFruits,
        walls: newWalls,
        score: newScore,
        level: newLevel,
        nextLevelScore: newNextLevelScore,
        gameSpeed: newGameSpeed
      }
    })
  }, [gameState, generateFruit])

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setTimeout(gameLoop, gameData.gameSpeed)
    }

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current)
      }
    }
  }, [gameState, gameData.gameSpeed, gameLoop])

  // Start new game
  const startGame = () => {
    directionRef.current = 'RIGHT'
    const initialFruits = []
    for (let i = 0; i < 3; i++) {
      initialFruits.push(generateFruit())
    }
    
    setGameData({
      snake: [{ x: 12, y: 12 }],
      fruits: initialFruits,
      walls: generateWalls(1),
      direction: 'RIGHT',
      score: 0,
      highScore: gameData.highScore,
      level: 1,
      gameSpeed: INITIAL_SPEED,
      nextLevelScore: SCORE_PER_LEVEL
    })
    setGameState('playing')
  }

  // Resume game
  const resumeGame = () => {
    setGameState('playing')
  }

  // Go to menu
  const goToMenu = () => {
    setGameState('menu')
  }

  // Render game cell
  const renderCell = (x: number, y: number) => {
    const snakeIndex = gameData.snake.findIndex(segment => segment.x === x && segment.y === y)
    const isSnake = snakeIndex !== -1
    const isHead = snakeIndex === 0
    const isTail = snakeIndex === gameData.snake.length - 1
    const fruit = gameData.fruits.find(f => f.position.x === x && f.position.y === y)
    const isWall = gameData.walls.some(wall => wall.x === x && wall.y === y)

    let cellClass = ''

    if (isWall) {
      cellClass += 'bg-gray-800 dark:bg-gray-600 '
    } else if (!isSnake) {
      cellClass += 'bg-white dark:bg-gray-900 '
    }

    return (
      <div
        key={`${x}-${y}`}
        className={cellClass + 'flex items-center justify-center text-lg font-bold transition-all duration-200 relative overflow-hidden'}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
        }}
      >
        {fruit && (
          <span className={`drop-shadow-lg ${FRUIT_CONFIG[fruit.type].shadow}`}>
            {FRUIT_CONFIG[fruit.type].emoji}
          </span>
        )}
        
        {isWall && (
          <span className="text-gray-900 dark:text-gray-100 text-lg">
            🧱
          </span>
        )}
        
        {isSnake && (() => {
          const segment = gameData.snake[snakeIndex];
          const toHead = snakeIndex > 0 ? gameData.snake[snakeIndex - 1] : null;
          const fromTail = snakeIndex < gameData.snake.length - 1 ? gameData.snake[snakeIndex + 1] : null;

          const connects = { up: false, down: false, left: false, right: false };

          if (toHead) {
              if (toHead.x < segment.x) connects.left = true;
              if (toHead.x > segment.x) connects.right = true;
              if (toHead.y < segment.y) connects.up = true;
              if (toHead.y > segment.y) connects.down = true;
          }

          if (fromTail) {
              if (fromTail.x < segment.x) connects.left = true;
              if (fromTail.x > segment.x) connects.right = true;
              if (fromTail.y < segment.y) connects.up = true;
              if (fromTail.y > segment.y) connects.down = true;
          }

          const bodyColor = "bg-green-500 dark:bg-green-400";
          const headColor = "bg-green-700 dark:bg-green-600";
          const scale = 0.85;
          const inset = `${(1 - scale) / 2 * 100}%`;
          const size = `${scale * 100}%`;

          const color = isHead ? headColor : bodyColor;

          return (
            <div className="w-full h-full absolute top-0 left-0">
              {/* Central part */}
              <div className={`absolute ${color}`} style={{
                  width: size, height: size,
                  top: inset, left: inset,
                  borderRadius: isHead ? '4px' : '2px'
              }}>
                {isHead && (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full border-black border"></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full border-black border"></div>
                        </div>
                    </div>
                )}
              </div>
              {/* Connections */}
              {connects.up && <div className={`absolute ${color}`} style={{ width: size, height: '51%', top: 0, left: inset }}></div>}
              {connects.down && <div className={`absolute ${color}`} style={{ width: size, height: '51%', bottom: 0, left: inset }}></div>}
              {connects.left && <div className={`absolute ${color}`} style={{ width: '51%', height: size, top: inset, left: 0 }}></div>}
              {connects.right && <div className={`absolute ${color}`} style={{ width: '51%', height: size, top: inset, right: 0 }}></div>}
            </div>
          );
        })()}
      </div>
    )
  }

  const levelProgress = ((gameData.score - (gameData.nextLevelScore - SCORE_PER_LEVEL)) / SCORE_PER_LEVEL) * 100

  // Main menu component
  const MainMenu = () => (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 font-heading">
          সাপের খেলা
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
          ফল খেয়ে সাপকে বড় করুন এবং স্কোর বাড়ান!
        </p>
      </div>

      <div className="flex flex-col gap-3 w-72">
        <Button onClick={startGame} className="text-lg py-3" size="lg">
          🎮 খেলা শুরু করুন
        </Button>
        
        {gameData.highScore > 0 && (
          <Card className="w-full">
            <CardContent className="pt-4">
              <div className="text-center font-sans">
                <div className="text-sm text-gray-500">সর্বোচ্চ স্কোর</div>
                <div className="text-xl font-bold text-green-600">{toBengaliNumber(gameData.highScore)}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-2">
          <Card className="w-full">
            <CardContent className="pt-3">
              <h3 className="font-medium mb-2 text-sm font-heading">নিয়ন্ত্রণ:</h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>↑ W - উপরে যান</div>
                <div>↓ S - নিচে যান</div>
                <div>← A - বামে যান</div>
                <div>→ D - ডানে যান</div>
                <div>Space - পজ করুন</div>
                <div>Esc - মেনুতে যান</div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardContent className="pt-3">
              <h3 className="font-medium mb-2 text-sm font-heading">নতুন ফিচার:</h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>🧱 দেয়াল এড়িয়ে চলুন</div>
                <div>📈 লেভেল অনুযায়ী দেয়াল বাড়ে</div>
                <div>⚡ দেয়ালে ধাক্কা লাগলে গেম ওভার</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  // Game over component
  const GameOverScreen = () => (
    <div className="text-center">
      <div className="text-red-600 dark:text-red-400 font-bold text-2xl mb-3 font-heading">
        খেলা শেষ!
      </div>
      <div className="text-lg mb-2 font-sans">আপনার স্কোর: <span className="font-bold">{toBengaliNumber(gameData.score)}</span></div>
      {gameData.score === gameData.highScore && gameData.score > 0 && (
        <div className="text-green-600 dark:text-green-400 font-bold mb-3">
          🎉 নতুন সর্বোচ্চ স্কোর!
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <Button onClick={startGame} className="text-sm py-2">
          আবার খেলুন
        </Button>
        <Button onClick={goToMenu} variant="outline" className="text-sm py-2">
          মেনু
        </Button>
      </div>
    </div>
  )

  // Paused screen
  const PausedScreen = () => (
    <div className="text-center">
      <div className="text-yellow-600 dark:text-yellow-400 font-bold text-2xl mb-3 font-heading">
        ⏸️ খেলা বন্ধ
      </div>
      <div className="flex gap-3 justify-center">
        <Button onClick={resumeGame} className="text-sm py-2">
          চালিয়ে যান
        </Button>
        <Button onClick={goToMenu} variant="outline" className="text-sm py-2">
          মেনু
        </Button>
      </div>
    </div>
  )

  return (
    <div className={`flex items-center justify-center h-screen gap-8 p-4 bg-white dark:bg-gray-950 overflow-auto ${gameState === 'menu' ? 'flex-col' : 'flex-row'}`}>
      {gameState === 'menu' && <MainMenu />}
      
      {(gameState === 'playing' || gameState === 'paused' || gameState === 'gameOver') && (
        <>
          {/* Game Board Column */}
          <Card className="p-3 shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg font-bold font-heading">খেলার বোর্ড</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div 
                className="grid border-4 border-gray-800 dark:border-gray-300 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-inner relative"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                  width: GRID_SIZE * CELL_SIZE,
                  height: GRID_SIZE * CELL_SIZE,
                  boxSizing: 'content-box',
                }}
              >
                {Array.from({ length: GRID_SIZE }, (_, y) =>
                  Array.from({ length: GRID_SIZE }, (_, x) => renderCell(x, y))
                )}
                
                {(gameState === 'paused' || gameState === 'gameOver') && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {gameState === 'paused' && <PausedScreen />}
                    {gameState === 'gameOver' && <GameOverScreen />}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Column */}
          <div className="flex flex-col gap-4 w-72">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1 font-heading">
                সাপের খেলা
              </h1>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={goToMenu} 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                >
                  🏠 মেনু
                </Button>
                {gameState === 'playing' && (
                  <Button 
                    onClick={() => setGameState('paused')} 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    ⏸️ পজ
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Card className="w-full shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-heading">খেলার পরিসংখ্যান</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">স্কোর:</span>
                    <Badge variant="secondary" className="text-base px-2 py-1 font-sans">
                      {toBengaliNumber(gameData.score)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">সর্বোচ্চ স্কোর:</span>
                    <Badge variant="outline" className="text-base px-2 py-1 font-sans">
                      {toBengaliNumber(gameData.highScore)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">লেভেল:</span>
                    <Badge variant="default" className="text-base px-2 py-1 font-sans">
                      {toBengaliNumber(gameData.level)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">গতি:</span>
                    <Badge variant="destructive" className="text-base px-2 py-1 font-sans">
                      {toBengaliNumber(Math.round((INITIAL_SPEED - gameData.gameSpeed + 120) / 8))}
                    </Badge>
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">লেভেল আপ:</span>
                      <span className="font-sans">{toBengaliNumber(gameData.nextLevelScore - gameData.score)} পয়েন্ট</span>
                    </div>
                    <Progress value={levelProgress} className="h-1" />
                  </div>

                  <div className="space-y-1 pt-2">
                    <h3 className="font-medium text-base mb-1 font-heading">নিয়ন্ত্রণ:</h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div>↑ W - উপরে যান</div>
                      <div>↓ S - নিচে যান</div>
                      <div>← A - বামে যান</div>
                      <div>→ D - ডানে যান</div>
                      <div>Space - পজ করুন</div>
                      <div>Esc - মেনুতে যান</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}