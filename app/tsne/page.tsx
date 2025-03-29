"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Home, RefreshCw, Play, Pause, SkipForward, ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

interface Point {
  x: number
  y: number
  originalData: number[]
  cluster: number
  opacity?: number
  size?: number
}

export default function TSNEPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [projectedPoints, setProjectedPoints] = useState<Point[]>([])
  const [dimensions, setDimensions] = useState(10)
  const [perplexity, setPerplexity] = useState(30)
  const [numClusters, setNumClusters] = useState(3)
  const [isRunning, setIsRunning] = useState(false)
  const [iteration, setIteration] = useState(0)
  const [maxIterations, setMaxIterations] = useState(100)
  const [speed, setSpeed] = useState(1)
  const [activeTab, setActiveTab] = useState("visualization")
  const [algorithmComplete, setAlgorithmComplete] = useState(false)
  const [datasetType, setDatasetType] = useState("clusters")
  const [showTrails, setShowTrails] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [pointTrails, setPointTrails] = useState<Point[][]>([])
  const [showAnimation, setShowAnimation] = useState(true)
  const [colorMode, setColorMode] = useState("cluster")
  const animationRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)

  const colors = [
    "#3498db",
    "#e74c3c",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#d35400",
    "#34495e",
    "#16a085",
    "#c0392b",
  ]

  // Initialize canvas and points
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Generate random points if none exist
    if (points.length === 0) {
      generateData()
    }

    // Draw points
    drawCanvas()

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [points, projectedPoints, iteration, canvasRef.current, showTrails, showLabels, colorMode])

  // Animation loop
  useEffect(() => {
    if (isRunning && !algorithmComplete) {
      const animate = (timestamp: number) => {
        if (timestamp - lastUpdateTimeRef.current > 1000 / speed) {
          lastUpdateTimeRef.current = timestamp
          runTSNEIteration()
        }
        animationRef.current = requestAnimationFrame(animate)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRunning, algorithmComplete, speed])

  // Generate data based on selected type
  const generateData = () => {
    switch (datasetType) {
      case "clusters":
        generateClusteredData()
        break
      case "gaussian":
        generateGaussianData()
        break
      case "spiral":
        generateSpiralData()
        break
      case "grid":
        generateGridData()
        break
      default:
        generateClusteredData()
    }
  }

  // Generate clustered data in high dimensions
  const generateClusteredData = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const newPoints: Point[] = []
    const pointsPerCluster = 30

    for (let c = 0; c < numClusters; c++) {
      // Generate cluster center in high dimensions
      const center: number[] = []
      for (let d = 0; d < dimensions; d++) {
        center.push((Math.random() * 2 - 1) * 3)
      }

      // Generate points around center
      for (let p = 0; p < pointsPerCluster; p++) {
        const originalData: number[] = []
        for (let d = 0; d < dimensions; d++) {
          originalData.push(center[d] + (Math.random() * 0.5 - 0.25))
        }

        // For initial visualization, project to 2D randomly
        const x = (Math.random() * 0.8 + 0.1) * canvas.width
        const y = (Math.random() * 0.8 + 0.1) * canvas.height

        newPoints.push({
          x,
          y,
          originalData,
          cluster: c,
          opacity: 1,
          size: 5,
        })
      }
    }

    setPoints(newPoints)
    setProjectedPoints([])
    setPointTrails([])
    setIteration(0)
    setAlgorithmComplete(false)
  }

  // Generate Gaussian mixture data
  const generateGaussianData = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const newPoints: Point[] = []
    const pointsPerCluster = 30

    for (let c = 0; c < numClusters; c++) {
      // Generate cluster center in high dimensions
      const center: number[] = []
      for (let d = 0; d < dimensions; d++) {
        center.push((Math.random() * 2 - 1) * 3)
      }

      // Generate points with Gaussian distribution
      for (let p = 0; p < pointsPerCluster; p++) {
        const originalData: number[] = []
        for (let d = 0; d < dimensions; d++) {
          // Box-Muller transform for Gaussian distribution
          const u1 = Math.random()
          const u2 = Math.random()
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
          originalData.push(center[d] + z * 0.5)
        }

        // For initial visualization, project to 2D randomly
        const x = (Math.random() * 0.8 + 0.1) * canvas.width
        const y = (Math.random() * 0.8 + 0.1) * canvas.height

        newPoints.push({
          x,
          y,
          originalData,
          cluster: c,
          opacity: 1,
          size: 5,
        })
      }
    }

    setPoints(newPoints)
    setProjectedPoints([])
    setPointTrails([])
    setIteration(0)
    setAlgorithmComplete(false)
  }

  // Generate spiral data
  const generateSpiralData = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const newPoints: Point[] = []
    const pointsPerSpiral = 30
    const numSpirals = Math.min(numClusters, 5) // Limit to 5 spirals max

    for (let c = 0; c < numSpirals; c++) {
      // Generate spiral in high dimensions
      for (let p = 0; p < pointsPerSpiral; p++) {
        const t = (p / pointsPerSpiral) * 2 * Math.PI * 3 // 3 turns
        const r = t / (2 * Math.PI) // Increasing radius

        const originalData: number[] = []

        // First 2 dimensions form a spiral
        originalData.push(r * Math.cos(t + (c * 2 * Math.PI) / numSpirals))
        originalData.push(r * Math.sin(t + (c * 2 * Math.PI) / numSpirals))

        // Other dimensions are random
        for (let d = 2; d < dimensions; d++) {
          originalData.push((Math.random() * 2 - 1) * 0.1)
        }

        // For initial visualization, project to 2D randomly
        const x = (Math.random() * 0.8 + 0.1) * canvas.width
        const y = (Math.random() * 0.8 + 0.1) * canvas.height

        newPoints.push({
          x,
          y,
          originalData,
          cluster: c,
          opacity: 1,
          size: 5,
        })
      }
    }

    setPoints(newPoints)
    setProjectedPoints([])
    setPointTrails([])
    setIteration(0)
    setAlgorithmComplete(false)
  }

  // Generate grid data
  const generateGridData = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const newPoints: Point[] = []
    const gridSize = Math.ceil(Math.sqrt(numClusters * 10)) // Grid size based on clusters

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const originalData: number[] = []

        // First 2 dimensions form a grid
        originalData.push((i / gridSize) * 2 - 1)
        originalData.push((j / gridSize) * 2 - 1)

        // Other dimensions are random
        for (let d = 2; d < dimensions; d++) {
          originalData.push((Math.random() * 2 - 1) * 0.1)
        }

        // For initial visualization, project to 2D randomly
        const x = (Math.random() * 0.8 + 0.1) * canvas.width
        const y = (Math.random() * 0.8 + 0.1) * canvas.height

        // Assign cluster based on grid position
        const cluster = Math.min(
          Math.floor((i * gridSize + j) / ((gridSize * gridSize) / numClusters)),
          numClusters - 1,
        )

        newPoints.push({
          x,
          y,
          originalData,
          cluster,
          opacity: 1,
          size: 5,
        })
      }
    }

    setPoints(newPoints)
    setProjectedPoints([])
    setPointTrails([])
    setIteration(0)
    setAlgorithmComplete(false)
  }

  const drawCanvas = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background grid
    drawGrid(ctx, canvas.width, canvas.height)

    // Draw point trails if enabled
    if (showTrails && pointTrails.length > 0) {
      drawPointTrails(ctx)
    }

    // Draw points
    if (projectedPoints.length > 0) {
      // Draw t-SNE projected points
      projectedPoints.forEach((point, index) => {
        const color = getPointColor(point)
        drawPoint(ctx, point.x, point.y, point.size || 5, color, point.opacity || 1)

        // Draw labels if enabled
        if (showLabels && index % 10 === 0) {
          // Only label every 10th point to avoid clutter
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
          ctx.font = "10px Arial"
          ctx.fillText(`C${point.cluster}`, point.x + 8, point.y - 8)
        }
      })
    } else {
      // Draw original points
      points.forEach((point, index) => {
        const color = getPointColor(point)
        drawPoint(ctx, point.x, point.y, point.size || 5, color, point.opacity || 1)

        // Draw labels if enabled
        if (showLabels && index % 10 === 0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
          ctx.font = "10px Arial"
          ctx.fillText(`C${point.cluster}`, point.x + 8, point.y - 8)
        }
      })
    }

    // Draw iteration counter and info
    drawInfoPanel(ctx, canvas.width, canvas.height)
  }

  const getPointColor = (point: Point) => {
    switch (colorMode) {
      case "cluster":
        return colors[point.cluster % colors.length]
      case "gradient":
        // Color based on position in 2D space
        const hue = ((point.x / canvasRef.current!.width) * 360) % 360
        const saturation = 70 + (point.y / canvasRef.current!.height) * 30
        return `hsl(${hue}, ${saturation}%, 50%)`
      case "dimension":
        // Color based on first dimension value
        const value = (point.originalData[0] + 1) / 2 // Normalize to 0-1
        return `rgb(${Math.floor(value * 255)}, ${Math.floor((1 - value) * 255)}, ${Math.floor(value * 100)})`
      default:
        return colors[point.cluster % colors.length]
    }
  }

  const drawPoint = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    opacity: number,
  ) => {
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = color.replace(")", `, ${opacity})`).replace("rgb", "rgba")
    ctx.fill()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 50
    ctx.strokeStyle = "rgba(200, 200, 200, 0.2)"
    ctx.lineWidth = 1

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw coordinate axes
    ctx.strokeStyle = "rgba(100, 100, 100, 0.4)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
  }

  const drawPointTrails = (ctx: CanvasRenderingContext2D) => {
    // Draw lines connecting trail points
    pointTrails.forEach((trail, pointIndex) => {
      if (trail.length < 2) return

      const point = projectedPoints[pointIndex] || points[pointIndex]
      if (!point) return

      ctx.strokeStyle = getPointColor(point).replace(")", ", 0.3)").replace("rgb", "rgba")
      ctx.lineWidth = 1
      ctx.beginPath()

      // Start from the most recent trail point
      ctx.moveTo(trail[0].x, trail[0].y)

      // Connect to previous trail points
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y)
      }

      ctx.stroke()
    })
  }

  const drawInfoPanel = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw info panel background
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
    ctx.fillRect(10, 10, 200, 80)
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)"
    ctx.strokeRect(10, 10, 200, 80)

    // Draw iteration counter
    ctx.fillStyle = "#333"
    ctx.font = "14px Arial"
    ctx.fillText(`Iteration: ${iteration}/${maxIterations}`, 20, 30)

    // Draw perplexity info
    ctx.fillText(`Perplexity: ${perplexity}`, 20, 50)

    // Draw status
    ctx.fillStyle = algorithmComplete ? "#2ecc71" : isRunning ? "#3498db" : "#7f8c8d"
    ctx.fillText(algorithmComplete ? "Complete!" : isRunning ? "Running..." : "Ready", 20, 70)

    // Draw progress bar
    const progressWidth = 180
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)"
    ctx.fillRect(20, 80, progressWidth, 5)

    const progress = iteration / maxIterations
    ctx.fillStyle = algorithmComplete ? "#2ecc71" : "#3498db"
    ctx.fillRect(20, 80, progressWidth * progress, 5)
  }

  const runTSNEIteration = () => {
    if (iteration >= maxIterations) {
      setIsRunning(false)
      setAlgorithmComplete(true)
      return
    }

    // In a real implementation, we would:
    // 1. Compute pairwise affinities in high-dimensional space
    // 2. Compute pairwise affinities in low-dimensional space
    // 3. Compute gradient of KL divergence
    // 4. Update low-dimensional embeddings

    // For this visualization, we'll simulate t-SNE by gradually moving points
    // to reveal cluster structure
    if (iteration === 0) {
      // Initialize projected points at random positions
      const canvas = canvasRef.current
      if (!canvas) return

      const newProjectedPoints = points.map((point) => ({
        ...point,
        x: (Math.random() * 0.8 + 0.1) * canvas.width,
        y: (Math.random() * 0.8 + 0.1) * canvas.height,
        opacity: 1,
        size: 5,
      }))

      setProjectedPoints(newProjectedPoints)

      // Initialize point trails
      const initialTrails = newProjectedPoints.map((point) => [{ ...point }])
      setPointTrails(initialTrails)
    } else {
      // Update projected points to gradually reveal clusters
      const canvas = canvasRef.current
      if (!canvas) return

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.4

      // Adjust progress based on animation style
      let progress
      if (showAnimation) {
        // Non-linear progress for more dramatic animation
        progress = Math.pow(iteration / (maxIterations * 0.7), 2) // Quadratic progress
        progress = Math.min(progress, 1) // Cap at 1
      } else {
        // Linear progress
        progress = Math.min(iteration / (maxIterations * 0.7), 1)
      }

      // Calculate cluster centers
      const clusterCenters: { x: number; y: number }[] = []
      for (let c = 0; c < numClusters; c++) {
        const angle = (c / numClusters) * Math.PI * 2
        clusterCenters.push({
          x: centerX + Math.cos(angle) * radius * 0.7,
          y: centerY + Math.sin(angle) * radius * 0.7,
        })
      }

      // Move points toward their cluster centers
      const newProjectedPoints = projectedPoints.map((point, index) => {
        const center = clusterCenters[point.cluster]

        // Add some noise to make it look more natural
        const noise = (1 - progress) * radius * 0.3
        const noiseX = (Math.random() * 2 - 1) * noise
        const noiseY = (Math.random() * 2 - 1) * noise

        // Interpolate between current position and cluster center
        const x = point.x * (1 - progress * 0.1) + (center.x + noiseX) * progress * 0.1
        const y = point.y * (1 - progress * 0.1) + (center.y + noiseY) * progress * 0.1

        // Add pulsing effect for size and opacity
        const pulsePhase = ((iteration + index) % 20) / 20
        const size = 5 + Math.sin(pulsePhase * Math.PI * 2) * (showAnimation ? 1 : 0)
        const opacity = 0.7 + 0.3 * Math.sin(pulsePhase * Math.PI * 2) * (showAnimation ? 1 : 0)

        return {
          ...point,
          x,
          y,
          size,
          opacity,
        }
      })

      setProjectedPoints(newProjectedPoints)

      // Update point trails
      if (showTrails && iteration % 5 === 0) {
        // Save trail every 5 iterations to avoid too many points
        const newTrails = [...pointTrails]
        newProjectedPoints.forEach((point, index) => {
          if (!newTrails[index]) {
            newTrails[index] = []
          }
          // Add current position to the trail, limit trail length
          newTrails[index] = [{ ...point }, ...newTrails[index].slice(0, 9)]
        })
        setPointTrails(newTrails)
      }
    }

    setIteration((prev) => prev + 1)
  }

  const toggleRunning = () => {
    if (algorithmComplete) {
      // Reset if algorithm was completed
      setIteration(0)
      setAlgorithmComplete(false)
      setProjectedPoints([])
      setPointTrails([])
      setIsRunning(true)
    } else {
      setIsRunning(!isRunning)
    }
  }

  const resetSimulation = () => {
    setIsRunning(false)
    setIteration(0)
    setAlgorithmComplete(false)
    setProjectedPoints([])
    setPointTrails([])
    generateData()
  }

  const stepForward = () => {
    if (!isRunning && !algorithmComplete) {
      runTSNEIteration()
    }
  }

  const showFinalResult = () => {
    setIteration(maxIterations)
    setAlgorithmComplete(true)

    // Generate final t-SNE result
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.4

    // Calculate cluster centers
    const clusterCenters: { x: number; y: number }[] = []
    for (let c = 0; c < numClusters; c++) {
      const angle = (c / numClusters) * Math.PI * 2
      clusterCenters.push({
        x: centerX + Math.cos(angle) * radius * 0.7,
        y: centerY + Math.sin(angle) * radius * 0.7,
      })
    }

    // Position points around their cluster centers
    const finalProjectedPoints = points.map((point) => {
      const center = clusterCenters[point.cluster]

      // Add some noise for natural cluster appearance
      const noise = radius * 0.15
      const noiseX = (Math.random() * 2 - 1) * noise
      const noiseY = (Math.random() * 2 - 1) * noise

      return {
        ...point,
        x: center.x + noiseX,
        y: center.y + noiseY,
        opacity: 1,
        size: 5,
      }
    })

    setProjectedPoints(finalProjectedPoints)

    // Create final point trails
    if (showTrails) {
      const finalTrails = finalProjectedPoints.map((point) => [{ ...point }])
      setPointTrails(finalTrails)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-slate-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">t-SNE</h1>
            <p className="mt-1 text-slate-600">Interactive visualization and explanation</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="visualization">Interactive Visualization</TabsTrigger>
            <TabsTrigger value="explanation">Algorithm Explanation</TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="dataset-type" className="mb-1 block">
                    Dataset Type
                  </Label>
                  <Select
                    value={datasetType}
                    onValueChange={(value) => {
                      setDatasetType(value)
                      // Reset and generate new data
                      setIsRunning(false)
                      setIteration(0)
                      setAlgorithmComplete(false)
                      setProjectedPoints([])
                      setPointTrails([])
                      setTimeout(() => generateData(), 0)
                    }}
                    disabled={isRunning}
                  >
                    <SelectTrigger id="dataset-type">
                      <SelectValue placeholder="Select dataset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clusters">Clusters</SelectItem>
                      <SelectItem value="gaussian">Gaussian Mixture</SelectItem>
                      <SelectItem value="spiral">Spiral</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="dimensions-value" className="mb-1 block">
                    Original Dimensions
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dimensions-value"
                      type="number"
                      min="3"
                      max="50"
                      value={dimensions}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value)
                        if (value >= 3 && value <= 50) {
                          setDimensions(value)
                        }
                      }}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="perplexity-value" className="mb-1 block">
                    Perplexity
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="perplexity-value"
                      type="number"
                      min="5"
                      max="50"
                      step="5"
                      value={perplexity}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value)
                        if (value >= 5 && value <= 50) {
                          setPerplexity(value)
                        }
                      }}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="clusters-value" className="mb-1 block">
                    Number of Clusters
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="clusters-value"
                      type="number"
                      min="2"
                      max="10"
                      value={numClusters}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value)
                        if (value >= 2 && value <= 10) {
                          setNumClusters(value)
                        }
                      }}
                      disabled={isRunning}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="speed-slider" className="mb-1 block">
                    Animation Speed
                  </Label>
                  <Slider
                    id="speed-slider"
                    min={1}
                    max={10}
                    step={1}
                    value={[speed]}
                    onValueChange={(value) => setSpeed(value[0])}
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="max-iterations" className="mb-1 block">
                    Max Iterations
                  </Label>
                  <Input
                    id="max-iterations"
                    type="number"
                    min="10"
                    max="500"
                    value={maxIterations}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value)
                      if (value >= 10 && value <= 500) {
                        setMaxIterations(value)
                      }
                    }}
                    disabled={isRunning}
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="color-mode" className="mb-1 block">
                    Color Mode
                  </Label>
                  <Select value={colorMode} onValueChange={setColorMode}>
                    <SelectTrigger id="color-mode">
                      <SelectValue placeholder="Select color mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cluster">By Cluster</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="dimension">By Dimension</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px] flex flex-col justify-end">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="show-trails">Show Point Trails</Label>
                    <Switch id="show-trails" checked={showTrails} onCheckedChange={setShowTrails} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-labels">Show Labels</Label>
                    <Switch id="show-labels" checked={showLabels} onCheckedChange={setShowLabels} />
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <div className="flex gap-2">
                  <Button onClick={toggleRunning} variant="default">
                    {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? "Pause" : algorithmComplete ? "Restart" : "Start"}
                  </Button>
                  <Button onClick={stepForward} variant="outline" disabled={isRunning || algorithmComplete}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Step
                  </Button>
                  <Button onClick={resetSimulation} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={showFinalResult} variant="outline" disabled={isRunning}>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Show Result
                  </Button>
                  <Button onClick={() => setShowAnimation(!showAnimation)} variant="outline">
                    <Zap className="mr-2 h-4 w-4" />
                    {showAnimation ? "Disable Effects" : "Enable Effects"}
                  </Button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-[500px] bg-white"></canvas>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-sm mb-2">What is t-SNE doing?</h3>
                    <p className="text-sm text-slate-600">
                      t-SNE is finding a 2D representation of your high-dimensional data that preserves local
                      relationships between points. Similar points in the original space stay close together in the
                      visualization.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-sm mb-2">Perplexity Explained</h3>
                    <p className="text-sm text-slate-600">
                      Perplexity controls how t-SNE balances local and global structure. Higher values (30-50) preserve
                      more global structure, while lower values (5-10) focus on local neighborhoods.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <h3 className="font-medium text-sm mb-2">Visualization Tips</h3>
                    <p className="text-sm text-slate-600">
                      Try different datasets and parameters to see how t-SNE behaves. Enable point trails to see how
                      points move during the optimization process.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                t-Distributed Stochastic Neighbor Embedding (t-SNE)
              </h2>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">What is t-SNE?</h3>
                  <p className="text-slate-700 mb-2">
                    t-Distributed Stochastic Neighbor Embedding (t-SNE) is a non-linear dimensionality reduction
                    technique that is particularly well-suited for visualizing high-dimensional data in a
                    low-dimensional space (typically 2D or 3D).
                  </p>
                  <p className="text-slate-700">
                    Unlike linear techniques like PCA, t-SNE is able to preserve local structure in the data, making it
                    excellent for revealing clusters and patterns that might not be apparent in the original
                    high-dimensional space.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">How t-SNE Works</h3>
                  <ol className="list-decimal list-inside space-y-4 text-slate-700">
                    <li className="pl-2">
                      <span className="font-medium">Compute Pairwise Similarities in High Dimensions:</span> For each
                      pair of points, compute a conditional probability that represents their similarity.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Initialize Low-Dimensional Embeddings:</span> Randomly initialize
                      points in the low-dimensional space.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Compute Pairwise Similarities in Low Dimensions:</span> Use a
                      t-distribution to compute similarities between points in the low-dimensional space.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Minimize KL Divergence:</span> Iteratively update the
                      low-dimensional embeddings to minimize the Kullback-Leibler divergence between the
                      high-dimensional and low-dimensional probability distributions.
                    </li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Mathematical Formulation</h3>
                  <p className="text-slate-700 mb-4">
                    In the high-dimensional space, the similarity between points x_i and x_j is represented as a
                    conditional probability:
                  </p>
                  <div className="bg-slate-50 p-4 rounded-md text-center mb-4">
                    <p className="text-slate-800 font-mono">
                      p(j|i) = exp(-||x_i - x_j||² / 2σ_i²) / sum(k!=i) exp(-||x_i - x_k||² / 2σ_i²)
                    </p>
                  </div>
                  <p className="text-slate-700 mb-4">
                    In the low-dimensional space, t-SNE uses a Student's t-distribution to compute similarities:
                  </p>
                  <div className="bg-slate-50 p-4 rounded-md text-center mb-4">
                    <p className="text-slate-800 font-mono">
                      q(i,j) = (1 + ||y_i - y_j||²)^(-1) / sum(k!=l) (1 + ||y_k - y_l||²)^(-1)
                    </p>
                  </div>
                  <p className="text-slate-700 mb-4">The Kullback-Leibler divergence between P and Q is minimized:</p>
                  <div className="bg-slate-50 p-4 rounded-md text-center mb-4">
                    <p className="text-slate-800 font-mono">KL(P||Q) = sum(i) sum(j) p(i,j) log(p(i,j) / q(i,j))</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Algorithm Implementation</h3>
                  <p className="text-slate-700 mb-4">Here's a JavaScript implementation of the t-SNE algorithm:</p>
                  <div className="bg-slate-50 p-4 rounded-md overflow-auto">
                    <pre className="text-sm text-slate-800 font-mono">
                      {`/**
 * t-SNE (t-Distributed Stochastic Neighbor Embedding) implementation
 * @param {Array} data - High-dimensional data points
 * @param {Number} dimensions - Target dimensions (usually 2)
 * @param {Number} perplexity - Perplexity parameter (5-50)
 * @param {Number} iterations - Number of iterations
 * @param {Number} learningRate - Learning rate
 * @returns {Array} - Low-dimensional embedding
 */
function tSNE(data, dimensions = 2, perplexity = 30, iterations = 1000, learningRate = 200) {
  const n = data.length;
  
  // Step 1: Compute pairwise affinities with perplexity in high dimension
  const P = computeGaussianPerplexity(data, perplexity);
  
  // Step 2: Initialize low-dimensional points randomly
  let Y = initializeY(n, dimensions);
  
  // Step 3: Perform gradient descent
  const gains = Array(n).fill().map(() => Array(dimensions).fill(1.0));
  const iY = Array(n).fill().map(() => Array(dimensions).fill(0.0));
  const momentum = 0.8;
  
  for (let iter = 0; iter < iterations; iter++) {
    // Compute pairwise affinities in low dimension (using t-distribution)
    const [Q, distances] = computeTDistribution(Y);
    
    // Compute gradients
    const gradients = computeGradients(P, Q, Y, distances);
    
    // Update Y using gradients and momentum
    for (let i = 0; i < n; i++) {
      for (let d = 0; d < dimensions; d++) {
        // Adaptive learning rate with gains
        if (Math.sign(gradients[i][d]) !== Math.sign(iY[i][d])) {
          gains[i][d] += 0.2;
        } else {
          gains[i][d] *= 0.8;
        }
        gains[i][d] = Math.max(gains[i][d], 0.01);
        
        // Update with momentum and learning rate
        iY[i][d] = momentum * iY[i][d] - learningRate * gains[i][d] * gradients[i][d];
        Y[i][d] += iY[i][d];
      }
    }
    
    // Center Y to prevent drifting
    if (iter % 100 === 0) {
      Y = centerY(Y);
    }
    
    // Reduce learning rate
    if (iter === 250) {
      learningRate /= 2;
    }
  }
  
  return Y;
}

/**
 * Compute Gaussian perplexity-based affinities in high dimension
 */
function computeGaussianPerplexity(X, perplexity) {
  const n = X.length;
  const P = Array(n).fill().map(() => Array(n).fill(0));
  
  // For each point
  for (let i = 0; i < n; i++) {
    // Binary search for sigma that gives desired perplexity
    let beta = 1.0;
    let betaMin = -Infinity;
    let betaMax = Infinity;
    const target = Math.log(perplexity);
    
    // Compute distances to all other points
    const distances = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        distances.push({
          j,
          dist: euclideanDistance(X[i], X[j])
        });
      }
    }
    
    // Binary search for beta (precision)
    let tries = 0;
    let diff = Infinity;
    
    while (Math.abs(diff) > 1e-5 && tries < 50) {
      // Compute Gaussian kernel with current beta
      let sum = 0;
      for (const { dist } of distances) {
        sum += Math.exp(-dist * beta);
      }
      
      // Compute entropy and corresponding perplexity
      let entropy = 0;
      for (const { dist } of distances) {
        const pij = Math.exp(-dist * beta) / sum;
        entropy -= pij * Math.log(pij + 1e-10);
      }
      
      // Check if we need to increase or decrease beta
      diff = entropy - target;
      
      if (diff > 0) {
        betaMin = beta;
        beta = (betaMax === Infinity) ? beta * 2 : (beta + betaMax) / 2;
      } else {
        betaMax = beta;
        beta = (betaMin === -Infinity) ? beta / 2 : (beta + betaMin) / 2;
      }
      
      tries++;
    }
    
    // Compute final probabilities with found beta
    let sum = 0;
    for (const { j, dist } of distances) {
      P[i][j] = Math.exp(-dist * beta);
      sum += P[i][j];
    }
    
    // Normalize
    for (const { j } of distances) {
      P[i][j] /= sum;
    }
  }
  
  // Symmetrize the probability matrix
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      P[i][j] = (P[i][j] + P[j][i]) / (2 * n);
    }
  }
  
  return P;
}

/**
 * Compute t-distribution in low dimension
 */
function computeTDistribution(Y) {
  const n = Y.length;
  const Q = Array(n).fill().map(() => Array(n).fill(0));
  const distances = Array(n).fill().map(() => Array(n).fill(0));
  
  // Compute pairwise squared distances
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = euclideanDistance(Y[i], Y[j]);
      distances[i][j] = dist;
      distances[j][i] = dist;
    }
  }
  
  // Compute Q matrix (joint probabilities in low dimension)
  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        // Student t-distribution with 1 degree of freedom
        Q[i][j] = 1 / (1 + distances[i][j]);
        sum += Q[i][j];
      }
    }
  }
  
  // Normalize
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Q[i][j] /= sum;
    }
  }
  
  return [Q, distances];
}

/**
 * Compute gradients for t-SNE
 */
function computeGradients(P, Q, Y, distances) {
  const n = Y.length;
  const dimensions = Y[0].length;
  const gradients = Array(n).fill().map(() => Array(dimensions).fill(0));
  
  // Compute gradients
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const factor = 4 * (P[i][j] - Q[i][j]) / (1 + distances[i][j]);
        
        for (let d = 0; d < dimensions; d++) {
          gradients[i][d] += factor * (Y[i][d] - Y[j][d]);
        }
      }
    }
  }
  
  return gradients;
}

/**
 * Initialize low-dimensional points randomly
 */
function initializeY(n, dimensions) {
  const scale = 1e-4;
  return Array(n).fill().map(() => 
    Array(dimensions).fill().map(() => (Math.random() * 2 - 1) * scale)
  );
}

/**
 * Center the embedding to prevent drifting
 */
function centerY(Y) {
  const n = Y.length;
  const dimensions = Y[0].length;
  
  // Compute mean
  const mean = Array(dimensions).fill(0);
  for (let i = 0; i < n; i++) {
    for (let d = 0; d < dimensions; d++) {
      mean[d] += Y[i][d];
    }
  }
  for (let d = 0; d < dimensions; d++) {
    mean[d] /= n;
  }
  
  // Subtract mean
  const centeredY = Array(n).fill().map(() => Array(dimensions).fill(0));
  for (let i = 0; i < n; i++) {
    for (let d = 0; d < dimensions; d++) {
      centeredY[i][d] = Y[i][d] - mean[d];
    }
  }
  
  return centeredY;
}

/**
 * Calculate Euclidean distance between two points
 */
function euclideanDistance(p1, p2) {
  let sum = 0;
  for (let i = 0; i < p1.length; i++) {
    sum += Math.pow(p1[i] - p2[i], 2);
  }
  return Math.sqrt(sum);
}`}
                    </pre>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    This implementation follows the t-SNE algorithm: compute pairwise affinities in high dimension using
                    Gaussian kernel with perplexity-based bandwidth, initialize low-dimensional points, compute pairwise
                    affinities in low dimension using t-distribution, and perform gradient descent to minimize KL
                    divergence between the two distributions.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Understanding Perplexity</h3>
                  <p className="text-slate-700 mb-2">
                    Perplexity is one of the most important parameters in t-SNE. It can be interpreted as a smooth
                    measure of the effective number of neighbors each point has.
                  </p>
                  <p className="text-slate-700 mb-4">
                    The perplexity value influences how t-SNE balances attention between local and global aspects of the
                    data:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-2">
                    <li>
                      <span className="font-medium">Low perplexity (5-10):</span> Focuses on very local structure, may
                      miss global patterns
                    </li>
                    <li>
                      <span className="font-medium">Medium perplexity (30-50):</span> Balances local and global
                      structure
                    </li>
                    <li>
                      <span className="font-medium">High perplexity (>50):</span> Focuses more on global structure, may
                      compress clusters
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Interactive Features Explained</h3>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h4 className="font-medium text-blue-800 mb-2">Dataset Types</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>
                          <span className="font-medium">Clusters:</span> Well-separated groups in high dimensions
                        </li>
                        <li>
                          <span className="font-medium">Gaussian Mixture:</span> Overlapping normal distributions
                        </li>
                        <li>
                          <span className="font-medium">Spiral:</span> Intricate non-linear structure
                        </li>
                        <li>
                          <span className="font-medium">Grid:</span> Regular pattern in high dimensions
                        </li>
                      </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-md">
                      <h4 className="font-medium text-purple-800 mb-2">Visualization Options</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>
                          <span className="font-medium">Point Trails:</span> Show how points move during optimization
                        </li>
                        <li>
                          <span className="font-medium">Color Modes:</span> Different ways to color points
                        </li>
                        <li>
                          <span className="font-medium">Animation Effects:</span> Visual enhancements for better
                          understanding
                        </li>
                        <li>
                          <span className="font-medium">Labels:</span> Identify cluster membership
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Advantages and Limitations</h3>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-medium text-green-800 mb-2">Advantages</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Preserves local structure of the data</li>
                        <li>Can reveal clusters and patterns</li>
                        <li>Works well for non-linear relationships</li>
                        <li>Effective for visualization</li>
                        <li>Robust to different data distributions</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="font-medium text-red-800 mb-2">Limitations</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Computationally intensive (O(n²))</li>
                        <li>Non-deterministic (results may vary between runs)</li>
                        <li>Cannot project new data without retraining</li>
                        <li>May not preserve global structure</li>
                        <li>Sensitive to hyperparameters</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Applications</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2">
                    <li>Visualizing high-dimensional data</li>
                    <li>Exploring clusters in data</li>
                    <li>Single-cell RNA sequencing analysis</li>
                    <li>Image and document visualization</li>
                    <li>Feature extraction for machine learning</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Study Resources</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-4 rounded-md">
                      <h4 className="font-medium text-slate-800 mb-2">Papers</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Visualizing Data using t-SNE by Laurens van der Maaten & Geoffrey Hinton (2008)</li>
                        <li>How to Use t-SNE Effectively by Martin Wattenberg, et al. (2016)</li>
                        <li>Accelerating t-SNE using Tree-Based Algorithms by Laurens van der Maaten (2014)</li>
                      </ul>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-md">
                      <h4 className="font-medium text-slate-800 mb-2">Online Resources</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Scikit-learn Documentation on t-SNE</li>
                        <li>Distill.pub: How to Use t-SNE Effectively</li>
                        <li>Google's Embedding Projector with t-SNE</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-slate-800 text-slate-300 py-8 mt-12">
        <div className="container mx-auto px-4">
          <p className="text-center">Interactive t-SNE Visualization | Created for educational purposes</p>
        </div>
      </footer>
    </div>
  )
}

