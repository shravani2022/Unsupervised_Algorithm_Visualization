"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Home, RefreshCw, Play, Pause, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Point {
  x: number
  y: number
  cluster: number
}

interface Centroid {
  x: number
  y: number
}

export default function KMeansPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [centroids, setCentroids] = useState<Centroid[]>([])
  const [k, setK] = useState(3)
  const [isRunning, setIsRunning] = useState(false)
  const [iteration, setIteration] = useState(0)
  const [maxIterations, setMaxIterations] = useState(20)
  const [speed, setSpeed] = useState(1)
  const [convergenceReached, setConvergenceReached] = useState(false)
  const [activeTab, setActiveTab] = useState("visualization")
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
      generateRandomPoints()
    }

    // Draw points and centroids
    drawCanvas()
  }, [points, centroids, canvasRef.current])

  // Animation loop
  useEffect(() => {
    if (isRunning && !convergenceReached) {
      const animate = (timestamp: number) => {
        if (timestamp - lastUpdateTimeRef.current > 1000 / speed) {
          lastUpdateTimeRef.current = timestamp
          runKMeansIteration()
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
  }, [isRunning, convergenceReached, speed])

  const generateRandomPoints = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const newPoints: Point[] = []

    // Generate 100 random points
    for (let i = 0; i < 100; i++) {
      newPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        cluster: -1,
      })
    }

    setPoints(newPoints)
    initializeCentroids()
    setIteration(0)
    setConvergenceReached(false)
  }

  const initializeCentroids = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const newCentroids: Centroid[] = []

    // Initialize k random centroids
    for (let i = 0; i < k; i++) {
      newCentroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      })
    }

    setCentroids(newCentroids)
  }

  const drawCanvas = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw points
    points.forEach((point) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = point.cluster >= 0 ? colors[point.cluster % colors.length] : "#ccc"
      ctx.fill()
    })

    // Draw centroids
    centroids.forEach((centroid, i) => {
      ctx.beginPath()
      ctx.arc(centroid.x, centroid.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }

  const distance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
  }

  const assignPointsToClusters = () => {
    const newPoints = [...points]
    let changed = false

    newPoints.forEach((point, i) => {
      let minDist = Number.POSITIVE_INFINITY
      let closestCluster = -1

      centroids.forEach((centroid, j) => {
        const dist = distance(point, centroid)
        if (dist < minDist) {
          minDist = dist
          closestCluster = j
        }
      })

      if (point.cluster !== closestCluster) {
        changed = true
        newPoints[i] = { ...point, cluster: closestCluster }
      }
    })

    setPoints(newPoints)
    return changed
  }

  const updateCentroids = () => {
    const newCentroids = [...centroids]

    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((p) => p.cluster === i)

      if (clusterPoints.length > 0) {
        const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0)
        const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0)

        newCentroids[i] = {
          x: sumX / clusterPoints.length,
          y: sumY / clusterPoints.length,
        }
      }
    }

    setCentroids(newCentroids)
  }

  const runKMeansIteration = () => {
    if (iteration >= maxIterations) {
      setIsRunning(false)
      setConvergenceReached(true)
      return
    }

    const changed = assignPointsToClusters()
    updateCentroids()

    setIteration((prev) => prev + 1)

    if (!changed) {
      setIsRunning(false)
      setConvergenceReached(true)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isRunning) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setPoints([...points, { x, y, cluster: -1 }])
  }

  const toggleRunning = () => {
    if (convergenceReached) {
      // Reset if convergence was reached
      setIteration(0)
      setConvergenceReached(false)

      // Reset cluster assignments
      setPoints(points.map((p) => ({ ...p, cluster: -1 })))

      // Initialize new centroids
      initializeCentroids()
    }

    setIsRunning(!isRunning)
  }

  const resetSimulation = () => {
    setIsRunning(false)
    setIteration(0)
    setConvergenceReached(false)
    generateRandomPoints()
  }

  const stepForward = () => {
    if (!isRunning && !convergenceReached) {
      runKMeansIteration()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">K-means Clustering</h1>
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="k-value">Number of Clusters (K)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="k-value"
                      type="number"
                      min="1"
                      max="10"
                      value={k}
                      onChange={(e) => {
                        const newK = Number.parseInt(e.target.value)
                        if (newK >= 1 && newK <= 10) {
                          setK(newK)
                          if (!isRunning) {
                            initializeCentroids()
                          }
                        }
                      }}
                      disabled={isRunning}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="speed-slider">Animation Speed</Label>
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
                  <Label htmlFor="max-iterations">Max Iterations</Label>
                  <Input
                    id="max-iterations"
                    type="number"
                    min="1"
                    max="100"
                    value={maxIterations}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value)
                      if (value >= 1 && value <= 100) {
                        setMaxIterations(value)
                      }
                    }}
                    disabled={isRunning}
                  />
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <div className="flex gap-2">
                  <Button onClick={toggleRunning} variant="default">
                    {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? "Pause" : convergenceReached ? "Restart" : "Start"}
                  </Button>
                  <Button onClick={stepForward} variant="outline" disabled={isRunning || convergenceReached}>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Step
                  </Button>
                  <Button onClick={resetSimulation} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="bg-slate-100 p-2 rounded-md mb-4 text-center">
                <p className="text-slate-700">
                  Iteration: {iteration} |
                  {convergenceReached ? (
                    <span className="text-green-600 font-medium"> Convergence reached!</span>
                  ) : isRunning ? (
                    <span className="text-blue-600"> Running...</span>
                  ) : (
                    <span className="text-slate-600"> Ready</span>
                  )}
                </p>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-[500px] bg-white cursor-crosshair"
                  onClick={handleCanvasClick}
                ></canvas>
              </div>

              <div className="mt-4 text-sm text-slate-600">
                <p>Click on the canvas to add points manually (when not running)</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explanation" className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">K-means Clustering Algorithm</h2>

              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">What is K-means?</h3>
                  <p className="text-slate-700 mb-2">
                    K-means is one of the simplest and most popular unsupervised machine learning algorithms for
                    clustering analysis. The goal of K-means is to partition n observations into k clusters where each
                    observation belongs to the cluster with the nearest mean (cluster center or centroid).
                  </p>
                  <p className="text-slate-700">
                    The algorithm aims to minimize the within-cluster sum of squares (WCSS), which is the sum of the
                    squared Euclidean distances between points and their assigned cluster centroids.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">How K-means Works</h3>
                  <ol className="list-decimal list-inside space-y-4 text-slate-700">
                    <li className="pl-2">
                      <span className="font-medium">Initialization:</span> Randomly select K points as initial
                      centroids.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Assignment Step:</span> Assign each data point to the nearest
                      centroid, forming K clusters.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Update Step:</span> Recalculate the centroids by taking the mean of
                      all points assigned to that centroid's cluster.
                    </li>
                    <li className="pl-2">
                      <span className="font-medium">Repeat:</span> Repeat steps 2 and 3 until centroids no longer move
                      significantly or a maximum number of iterations is reached.
                    </li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Mathematical Formulation</h3>
                  <p className="text-slate-700 mb-4">
                    K-means aims to minimize the objective function, which is the sum of squared distances from each
                    point to its assigned centroid:
                  </p>
                  <div className="bg-slate-50 p-4 rounded-md text-center mb-4">
                    <p className="text-slate-800 font-mono">
                      J = Σ Σ ||x<sub>i</sub>
                      <sup>(j)</sup> - c<sub>j</sub>||<sup>2</sup>
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      Where x<sub>i</sub>
                      <sup>(j)</sup> is the i-th data point in cluster j, and c<sub>j</sub> is the centroid of cluster j
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Algorithm Implementation</h3>
                  <p className="text-slate-700 mb-4">Here's a JavaScript implementation of the K-means algorithm:</p>
                  <div className="bg-slate-50 p-4 rounded-md overflow-auto">
                    <pre className="text-sm text-slate-800 font-mono">
                      {`/**
 * K-means clustering algorithm implementation
 * @param {Array} data - Array of data points
 * @param {Number} k - Number of clusters
 * @param {Number} maxIterations - Maximum number of iterations
 * @returns {Object} - Centroids and assignments
 */
function kMeans(data, k, maxIterations = 100) {
  // Initialize centroids randomly
  let centroids = initializeCentroids(data, k);
  let assignments = [];
  let iteration = 0;
  let changed = true;
  
  // Continue until convergence or max iterations
  while (changed && iteration < maxIterations) {
    // Assign points to nearest centroid
    changed = assignPointsToClusters(data, centroids, assignments);
    
    // Update centroids based on assignments
    updateCentroids(data, centroids, assignments, k);
    
    iteration++;
  }
  
  return { centroids, assignments, iteration, converged: !changed };
}

/**
 * Initialize k centroids randomly from the data
 */
function initializeCentroids(data, k) {
  const centroids = [];
  const used = new Set();
  
  // Select k random points as initial centroids
  while (centroids.length < k) {
    const index = Math.floor(Math.random() * data.length);
    if (!used.has(index)) {
      used.add(index);
      centroids.push([...data[index]]); // Clone the point
    }
  }
  
  return centroids;
}

/**
 * Assign each point to the nearest centroid
 */
function assignPointsToClusters(data, centroids, assignments) {
  let changed = false;
  
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    let minDist = Infinity;
    let closestCentroid = -1;
    
    // Find the closest centroid
    for (let j = 0; j < centroids.length; j++) {
      const dist = distance(point, centroids[j]);
      if (dist < minDist) {
        minDist = dist;
        closestCentroid = j;
      }
    }
    
    // Check if assignment changed
    if (assignments[i] !== closestCentroid) {
      changed = true;
      assignments[i] = closestCentroid;
    }
  }
  
  return changed;
}

/**
 * Update centroids based on mean of assigned points
 */
function updateCentroids(data, centroids, assignments, k) {
  // Initialize arrays to track sum and count for each dimension
  const sums = Array(k).fill().map(() => Array(data[0].length).fill(0));
  const counts = Array(k).fill(0);
  
  // Sum up all points assigned to each centroid
  for (let i = 0; i < data.length; i++) {
    const cluster = assignments[i];
    counts[cluster]++;
    
    for (let dim = 0; dim < data[i].length; dim++) {
      sums[cluster][dim] += data[i][dim];
    }
  }
  
  // Calculate new centroid positions
  for (let i = 0; i < k; i++) {
    if (counts[i] > 0) {
      for (let dim = 0; dim < centroids[i].length; dim++) {
        centroids[i][dim] = sums[i][dim] / counts[i];
      }
    }
  }
}

/**
 * Calculate Euclidean distance between two points
 */
function distance(p1, p2) {
  let sum = 0;
  for (let i = 0; i < p1.length; i++) {
    sum += Math.pow(p1[i] - p2[i], 2);
  }
  return Math.sqrt(sum);
}`}
                    </pre>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    This implementation follows the standard K-means algorithm: initialize random centroids, assign
                    points to the nearest centroid, update centroids, and repeat until convergence or maximum
                    iterations.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Advantages and Limitations</h3>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 p-4 rounded-md">
                      <h4 className="font-medium text-green-800 mb-2">Advantages</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Simple to understand and implement</li>
                        <li>Scales well to large datasets</li>
                        <li>Guarantees convergence</li>
                        <li>Works well when clusters are spherical and similar in size</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="font-medium text-red-800 mb-2">Limitations</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Requires specifying K in advance</li>
                        <li>Sensitive to initial centroid positions</li>
                        <li>Not suitable for non-spherical clusters</li>
                        <li>Sensitive to outliers</li>
                        <li>May converge to local optima</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Applications</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-2">
                    <li>Customer segmentation for marketing strategies</li>
                    <li>Document classification and topic modeling</li>
                    <li>Image compression and segmentation</li>
                    <li>Anomaly detection</li>
                    <li>Recommendation systems</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">Study Resources</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-4 rounded-md">
                      <h4 className="font-medium text-slate-800 mb-2">Books</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Introduction to Data Mining by Tan, Steinbach, and Kumar</li>
                        <li>Pattern Recognition and Machine Learning by Christopher Bishop</li>
                        <li>Data Mining: Concepts and Techniques by Han and Kamber</li>
                      </ul>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-md">
                      <h4 className="font-medium text-slate-800 mb-2">Online Resources</h4>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        <li>Stanford CS229 Machine Learning Course</li>
                        <li>Scikit-learn Documentation on K-means</li>
                        <li>Coursera Machine Learning Specialization</li>
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
          <p className="text-center">Interactive K-means Clustering Visualization | Created for educational purposes</p>
        </div>
      </footer>
    </div>
  )
}

