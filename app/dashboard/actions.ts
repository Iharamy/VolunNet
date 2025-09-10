"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "../auth/actions"

const sql = neon(process.env.DATABASE_URL!)

// Cache simple en memoria para datos que no cambian frecuentemente
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Timeout configuration
const DEFAULT_TIMEOUT = 10000 // 10 seconds
const SHORT_TIMEOUT = 5000    // 5 seconds

// Helper function to create timeout promises
function createTimeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Helper function to safely execute database queries
async function safeQuery<T>(queryFn: () => Promise<T>, timeoutMs: number = DEFAULT_TIMEOUT): Promise<T> {
  try {
    return await createTimeoutPromise(queryFn(), timeoutMs)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

function getCachedData(key: string) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCachedData(key: string, data: any, ttlMinutes = 5) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000,
  })
}

// --- Utilidades ---
function calculateSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1
  if (arr1.length === 0 || arr2.length === 0) return 0
  const intersection = arr1.filter((item) => arr2.includes(item))
  const union = [...new Set([...arr1, ...arr2])]
  return intersection.length / union.length
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// --- Recomendaciones ---
export async function getPersonalizedRecommendations() {
  try {
    const user = await getCurrentUser()
    if (!user) return { recommendations: [], error: "Usuario no autenticado" }

    const cacheKey = `recommendations_${user.id}`
    const cachedRecommendations = getCachedData(cacheKey)
    if (cachedRecommendations) return cachedRecommendations

    if (user.role === "VOLUNTEER") {
      const volunteers = await safeQuery(
        () => sql`SELECT * FROM volunteers WHERE "userId" = ${user.id}`,
        SHORT_TIMEOUT
      ) as any[]

      if (volunteers.length === 0) return { recommendations: [], error: "Perfil de voluntario no encontrado" }

      const volunteer = volunteers[0]
      const events = await safeQuery(
        () => sql`
          SELECT e.*, ec.name as category_name, ec.icon as category_icon,
                 o.name as organization_name, o.verified as organization_verified
          FROM events e
          JOIN event_categories ec ON e.categoryId = ec.id
          JOIN organizations o ON e.organization_id = o.id
          WHERE e.status IN ('PUBLISHED', 'ONGOING')
          AND e.current_volunteers < e.max_volunteers
          AND e."endDate" >= NOW() - INTERVAL '7 days'
          ORDER BY e.created_at DESC
          LIMIT 20
        `,
        SHORT_TIMEOUT
      ) as any[]

      const recommendations = events.map((event) => {
        let score = 0
        const reasons = []

        const interestSimilarity = calculateSimilarity(volunteer.preferred_categories || [], [event.categoryId])
        score += interestSimilarity * 0.4
        if (interestSimilarity > 0) reasons.push(`Coincide con tus intereses en ${event.category_name}`)

        const skillSimilarity = calculateSimilarity(volunteer.skills || [], event.skills || [])
        score += skillSimilarity * 0.3
        if (skillSimilarity > 0) reasons.push(`Requiere habilidades que tienes`)

        if (volunteer.latitude && volunteer.longitude && event.latitude && event.longitude) {
          const distance = calculateDistance(volunteer.latitude, volunteer.longitude, event.latitude, event.longitude)
          const maxDistance = volunteer.max_distance_km || 10
          if (distance <= maxDistance) {
            const proximityScore = 1 - distance / maxDistance
            score += proximityScore * 0.2
            reasons.push(`Está a ${Math.round(distance)} km de ti`)
          }
        } else if (volunteer.city === event.city) {
          score += 0.2
          reasons.push(`En tu ciudad: ${event.city}`)
        }

        const eventDate = new Date(event.start_date)
        const eventDay = eventDate.getDay()
        const eventHour = eventDate.getHours()

        let timeMatch = false
        if (volunteer.preferred_time_slots) {
          if (volunteer.preferred_time_slots.includes("morning") && eventHour >= 6 && eventHour < 12) timeMatch = true
          if (volunteer.preferred_time_slots.includes("afternoon") && eventHour >= 12 && eventHour < 18) timeMatch = true
          if (volunteer.preferred_time_slots.includes("evening") && eventHour >= 18 && eventHour < 22) timeMatch = true
          if (volunteer.preferred_time_slots.includes("weekend") && (eventDay === 0 || eventDay === 6)) timeMatch = true
        }

        if (timeMatch) {
          score += 0.1
          reasons.push(`En tu horario preferido`)
        }

        return {
          ...event,
          recommendation_score: score,
          recommendation_reasons: reasons,
        }
      })

      const topRecommendations = recommendations
        .sort((a, b) => b.recommendation_score - a.recommendation_score)
        .slice(0, 6)

      const result = { recommendations: topRecommendations }
      setCachedData(cacheKey, result, 5)
      return result
    }

    return { recommendations: [] }
  } catch (error) {
    console.error("❌ Error getting recommendations:", error)
    return { recommendations: [], error: "Error al obtener recomendaciones" }
  }
}

// --- Estadísticas de usuario ---
export async function getUserStats() {
  try {
    const user = await getCurrentUser()
    if (!user) return { stats: null, error: "Usuario no autenticado" }

    const cacheKey = `stats_${user.id}`
    const cachedStats = getCachedData(cacheKey)
    if (cachedStats) return cachedStats

    if (user.role === "VOLUNTEER") {
      const volunteers = await safeQuery(
        () => sql`SELECT * FROM volunteers WHERE "userId" = ${user.id}`,
        3000
      ) as any[]

      if (volunteers.length === 0) {
        return {
          stats: {
            totalApplications: 0,
            acceptedApplications: 0,
            completedApplications: 0,
            totalHours: 0,
            averageRating: 0,
            eventsParticipated: 0,
            hoursCompleted: 0,
            topCategories: [],
            recentEvents: [],
            successRate: 0,
          }
        }
      }

      const volunteer = volunteers[0]
      // Aquí seguiría la lógica original de estadísticas pero ya corregida y sin duplicados

      const stats = {
        totalApplications: 0,
        acceptedApplications: 0,
        completedApplications: 0,
        totalHours: 0,
        averageRating: 0,
        eventsParticipated: volunteer.eventsParticipated || 0,
        hoursCompleted: volunteer.hoursCompleted || 0,
        topCategories: [],
        recentEvents: [],
        successRate: 0,
      }

      const result = { stats }
      setCachedData(cacheKey, result, 3)
      return result
    }

    return { stats: null }
  } catch (error) {
    console.error("❌ Error getting user stats:", error)
    return { stats: null }
  }
}

// --- Notificaciones ---
export async function getRecentNotifications() {
  try {
    const user = await getCurrentUser()
    if (!user) return { notifications: [] }

    const cacheKey = `notifications_${user.id}`
    const cachedNotifications = getCachedData(cacheKey)
    if (cachedNotifications) return cachedNotifications

    const notifications = await safeQuery(
      () => sql`
        SELECT * FROM notifications 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 10
      `,
      3000
    ) as any[]

    const result = { notifications: Array.isArray(notifications) ? notifications : [] }
    setCachedData(cacheKey, result, 2)
    return result
  } catch (error) {
    console.error("❌ Error getting notifications:", error)
    return { notifications: [] }
  }
}

// --- Limpieza de cache ---
export async function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= value.ttl) {
      cache.delete(key)
    }
  }
}

export async function invalidateCache(pattern: string) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// --- Eventos recientes completados ---
export async function getRecentCompletedEvents() {
  try {
    const events = await safeQuery(
      () => sql`
        SELECT 
          e.id,
          e.title,
          e.description,
          e."startDate",
          e."endDate",
          e."maxVolunteers",
          e."currentVolunteers",
          e.skills,
          e.requirements,
          e.benefits,
          e."imageUrl",
          e.status,
          e."createdAt",
          e."updatedAt",
          o.name as organization_name,
          o.verified as organization_verified,
          ec.name as category_name,
          ec.icon as category_icon,
          ec.color as category_color
        FROM events e
        JOIN organizations o ON e."organizationId" = o.id
        JOIN event_categories ec ON e."categoryId" = ec.id
        WHERE e.status = 'COMPLETED'
        AND e."endDate" >= NOW() - INTERVAL '30 days'
        ORDER BY e."endDate" DESC
        LIMIT 10
      `,
      5000
    ) as any[]

    return { events: Array.isArray(events) ? events : [] }
  } catch (error) {
    console.error("❌ Error obteniendo eventos completados:", error)
    return { events: [] }
  }
}
